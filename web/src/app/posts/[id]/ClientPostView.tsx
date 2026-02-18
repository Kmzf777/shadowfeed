'use client';

import { useRef, useState, useEffect } from 'react';
import { LivePreview } from '@/components/LivePreview';
import type { CarouselData, SlideData } from '@/types/renderer/slide.types';
import jsZip from 'jszip';
import html2canvas from 'html2canvas';
import { Pencil, Save, Loader2, Download, ChevronLeft, Eye, Image as ImageIcon, Play, Pause } from 'lucide-react';
import { updatePostSlides } from './actions';
import { applyTheme, EDITORIAL_THEME, AUTHORITY_THEME, type ContentCarousel } from '@/lib/theme-applier';
import { Sidebar } from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { PreviewModal } from '@/components/PreviewModal';
import { getContrastColor } from '@/lib/utils';

interface ClientPostViewProps {
    post: any;
    carouselData: CarouselData;
    content_json?: ContentCarousel | null;
}

const HEADLINE_SIZES = ['48px', '56px', '64px', '72px', '80px', '96px'] as const;
const BODY_SIZES = ['18px', '20px', '24px', '28px', '32px', '36px'] as const;

const AVAILABLE_THEMES = [
    { id: 'editorial', name: 'Editorial Magazine', preview: { bg: '#0A0A0A', accent: '#8a00c4' } },
    { id: 'authority', name: 'Tweet Thread', preview: { bg: '#FFFFFF', accent: '#8a00c4' } },
] as const;

// Available layouts per style
const EDITORIAL_LAYOUTS = [
    'hero-image', 'article-body', 'title-body', 'split-left', 'split-right',
    'profile-card', 'headline-only', 'numbered-item', 'bento-grid'
] as const;

const AUTHORITY_LAYOUTS = [
    'tweet-hook', 'tweet-card', 'tweet-image-card', 'tweet-engagement', 'tweet-cta'
] as const;

const GOOGLE_FONTS = [
    'Inter',
    'Inter Tight',
    'Roboto',
    'Open Sans',
    'Montserrat',
    'Lato',
    'Poppins',
    'Oswald',
    'Raleway',
    'Nunito',
    'Playfair Display',
    'Merriweather',
    'Rubik',
    'Work Sans',
    'Lora',
    'Fira Sans',
    'Barlow',
    'Mulish',
    'Quicksand',
    'Sora',
    'Outfit'
] as const;

async function recordVideoSlide(
    el: HTMLDivElement,
    onStatus: (msg: string) => void,
): Promise<{ blob: Blob; extension: string }> {
    const videoEl = el.querySelector('video') as HTMLVideoElement | null;
    if (!videoEl) throw new Error('No video element in slide');

    // BUG 1 FIX: Lift opacity to 1 for the ENTIRE session so html2canvas
    // captures a real image and the browser decodes video frames normally.
    // try/finally guarantees restoration even if recording throws.
    const outerWrapper = el.parentElement as HTMLElement;
    const originalOpacity = outerWrapper.style.opacity;
    outerWrapper.style.opacity = '1';

    try {
        // BUG 2 FIX: Wait for HAVE_CURRENT_DATA (readyState >= 2) not just HAVE_METADATA (>= 1).
        // 'loadeddata' fires exactly when the first frame is decodable.
        if (videoEl.readyState < 2) {
            await new Promise<void>((resolve, reject) => {
                const onLoaded = () => {
                    videoEl.removeEventListener('loadeddata', onLoaded);
                    videoEl.removeEventListener('error', onError);
                    resolve();
                };
                const onError = () => {
                    videoEl.removeEventListener('loadeddata', onLoaded);
                    videoEl.removeEventListener('error', onError);
                    reject(new Error('Video load failed'));
                };
                videoEl.addEventListener('loadeddata', onLoaded);
                videoEl.addEventListener('error', onError);
                videoEl.load();
            });
        }

        onStatus('Capturing slide layout...');
        const staticCanvas = await html2canvas(el, {
            scale: 1, useCORS: true, backgroundColor: null, logging: false,
        });

        const slideRect = el.getBoundingClientRect();
        const videoRect = videoEl.getBoundingClientRect();
        const vx = videoRect.left - slideRect.left;
        const vy = videoRect.top - slideRect.top;
        const vw = videoRect.width;
        const vh = videoRect.height;

        const nw = videoEl.videoWidth;
        const nh = videoEl.videoHeight;
        const coverScale = Math.max(vw / nw, vh / nh);
        const srcX = ((nw * coverScale - vw) / 2) / coverScale;
        const srcY = ((nh * coverScale - vh) / 2) / coverScale;
        const srcW = vw / coverScale;
        const srcH = vh / coverScale;

        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext('2d')!;

        const canvasStream = canvas.captureStream(30);
        const videoStream = (videoEl as any).captureStream?.() as MediaStream | undefined;
        videoStream?.getAudioTracks().forEach(t => canvasStream.addTrack(t));

        const mimeType = ['video/webm;codecs=vp8,opus', 'video/webm']
            .find(t => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';

        const recorder = new MediaRecorder(canvasStream, { mimeType });
        const chunks: Blob[] = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

        // Seek to start with 300ms fallback for already-at-t=0 race
        await new Promise<void>(resolve => {
            let done = false;
            const finish = () => { if (!done) { done = true; resolve(); } };
            videoEl.onseeked = finish;
            videoEl.currentTime = 0;
            setTimeout(finish, 300);
        });

        videoEl.muted = true;
        const hadLoop = videoEl.loop;
        videoEl.loop = false;

        // BUG 3 FIX: Hard deadline — stops recording if onended never fires
        const durationMs = Number.isFinite(videoEl.duration)
            ? Math.ceil(videoEl.duration) * 1000
            : 60_000;
        let timeoutHandle: ReturnType<typeof setTimeout>;

        const slideNumber = Array.from(outerWrapper.children).indexOf(el) + 1;
        onStatus(`Recording slide ${slideNumber} video...`);

        // BUG 5 FIX: Prefer requestVideoFrameCallback (fires per decoded frame),
        // fall back to requestAnimationFrame.
        const supportsRVFC = typeof (videoEl as any).requestVideoFrameCallback === 'function';
        let animHandle: number;

        const drawFrame = () => {
            ctx.drawImage(staticCanvas, 0, 0);
            ctx.drawImage(videoEl, srcX, srcY, srcW, srcH, vx, vy, vw, vh);
        };

        const rafLoop = () => {
            drawFrame();
            if (!videoEl.ended) animHandle = requestAnimationFrame(rafLoop);
        };

        const rvfcLoop = () => {
            drawFrame();
            if (!videoEl.ended) (videoEl as any).requestVideoFrameCallback(rvfcLoop);
        };

        return new Promise<{ blob: Blob; extension: string }>((resolve, reject) => {
            const cleanup = () => {
                videoEl.muted = false;
                videoEl.loop = hadLoop;
                videoEl.onseeked = null;
                videoEl.onended = null;
                clearTimeout(timeoutHandle);
            };

            recorder.onstop = () => {
                cleanup();
                resolve({ blob: new Blob(chunks, { type: mimeType }), extension: 'webm' });
            };

            recorder.onerror = (e) => {
                cleanup();
                if (!supportsRVFC) cancelAnimationFrame(animHandle);
                reject(e);
            };

            recorder.start(100);

            videoEl.play()
                .then(() => {
                    if (supportsRVFC) {
                        (videoEl as any).requestVideoFrameCallback(rvfcLoop);
                    } else {
                        animHandle = requestAnimationFrame(rafLoop);
                    }
                })
                .catch(reject);

            videoEl.onended = () => {
                drawFrame(); // capture last frame
                if (!supportsRVFC) cancelAnimationFrame(animHandle);
                recorder.stop();
            };

            // Hard deadline: stop recording even if onended never fires
            timeoutHandle = setTimeout(() => {
                console.warn(`recordVideoSlide: hard timeout after ${durationMs + 8000}ms`);
                if (recorder.state === 'recording') {
                    if (!supportsRVFC) cancelAnimationFrame(animHandle);
                    recorder.stop();
                }
            }, durationMs + 8000);
        });

    } finally {
        outerWrapper.style.opacity = originalOpacity;
    }
}

function ScaleWrapper({ children }: { children: React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.3);

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                // Target width is 1080px (slide width)
                setScale(width / 1080);
            }
        };

        // Initial update
        updateScale();

        // Add minimal delay to ensure layout is computed
        setTimeout(updateScale, 100);

        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    return (
        <div ref={containerRef} className="w-full relative bg-neutral-900" style={{ aspectRatio: '4/5' }}>
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 1080,
                    height: 1350,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                }}
            >
                {children}
            </div>
        </div>
    );
}

export function ClientPostView({ post, carouselData: initialCarouselData, content_json }: ClientPostViewProps) {
    const router = useRouter();
    const [carouselData, setCarouselData] = useState<CarouselData>(() => {
        const data = { ...initialCarouselData };
        // Ensure fonts are set to Inter Tight / Inter by default if missing
        if (!data.fonts) {
            data.fonts = { headline: 'Inter Tight', body: 'Inter' };
        } else {
            if (!data.fonts.headline) data.fonts.headline = 'Inter Tight';
            if (!data.fonts.body) data.fonts.body = 'Inter';
        }

        // Ensure all slides have the font properties
        data.slides = data.slides.map(slide => ({
            ...slide,
            font_headline: slide.font_headline || data.fonts.headline,
            font_body: slide.font_body || data.fonts.body,
            font_size_headline: slide.font_size_headline || '48px',
            font_size_body: slide.font_size_body || '24px'
        }));

        return data;
    });
    const [uploads, setUploads] = useState<Record<number, string>>({});
    const [uploadTypes, setUploadTypes] = useState<Record<number, boolean>>({});
    const [uploadFiles, setUploadFiles] = useState<Record<number, File>>({});
    const [playingVideos, setPlayingVideos] = useState<Record<number, boolean>>({});
    const slideGridRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
    const isDownloading = downloadStatus !== null;
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Default theme based on style
    const [currentThemeId, setCurrentThemeId] = useState<string>(carouselData.style === 'tweet-thread' ? 'authority' : 'editorial');

    // Editing state
    const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const updatePalette = (key: keyof CarouselData['color_palette'], value: string) => {
        setCarouselData(prev => {
            const oldColor = prev.color_palette[key];
            const newColor = value;

            const newSlides = prev.slides.map(slide => {
                const newSlide = { ...slide };
                if (key === 'bg_primary' || key === 'bg_secondary') {
                    if (slide.bg_color.toLowerCase() === oldColor.toLowerCase()) newSlide.bg_color = newColor;
                }
                if (key === 'text_primary' || key === 'text_secondary') {
                    if (slide.text_color.toLowerCase() === oldColor.toLowerCase()) newSlide.text_color = newColor;
                }
                if (key === 'accent') {
                    // Update accent color for all slides
                    if (slide.accent_color.toLowerCase() === oldColor.toLowerCase()) {
                        newSlide.accent_color = newColor;
                    }

                    // CRITICAL FIX: If background was the old accent color, update it to the NEW accent color
                    if (slide.bg_color.toLowerCase() === oldColor.toLowerCase()) {
                        newSlide.bg_color = newColor;
                        // Also update text color to ensure contrast on the new accent background
                        newSlide.text_color = getContrastColor(newColor);
                    }
                }
                return newSlide;
            });

            return {
                ...prev,
                slides: newSlides,
                color_palette: { ...prev.color_palette, [key]: value }
            };
        });
    };

    const updateFont = (type: 'headline' | 'body', font: string) => {
        setCarouselData(prev => {
            const newSlides = prev.slides.map(slide => ({
                ...slide,
                [type === 'headline' ? 'font_headline' : 'font_body']: font
            }));

            return {
                ...prev,
                fonts: { ...prev.fonts, [type]: font },
                slides: newSlides
            };
        });
    };

    const handleThemeSwitch = (themeId: 'editorial' | 'authority') => {
        if (!content_json) return;
        const theme = themeId === 'editorial' ? EDITORIAL_THEME : AUTHORITY_THEME;
        const newCarouselData = applyTheme(content_json, theme) as CarouselData;

        // Preserve the font choice the user had before switching themes
        const savedFonts = carouselData.fonts;
        newCarouselData.fonts = savedFonts;
        newCarouselData.slides = newCarouselData.slides.map(slide => ({
            ...slide,
            font_headline: savedFonts.headline,
            font_body: savedFonts.body,
        }));

        setCarouselData(newCarouselData);
        setCurrentThemeId(themeId);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updatePostSlides(
                post.id,
                carouselData.slides,
                carouselData.color_palette,
                content_json,
                carouselData.caption,
                carouselData.hashtags,
                carouselData.profile?.display_name,
                carouselData.profile?.username,
                carouselData.profile?.avatar_url,
                carouselData.fonts
            );
            if (result.success) {
                // Success feedback could go here
                const btn = document.activeElement as HTMLButtonElement;
                if (btn) btn.blur();
            } else {
                alert('Failed to save changes: ' + result.error);
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('An error occurred while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    const exportRefs = useRef<(HTMLDivElement | null)[]>([]);

    const handleUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const isVideo = file.type.startsWith('video/');
            setUploads(prev => ({ ...prev, [index]: url }));
            setUploadTypes(prev => ({ ...prev, [index]: isVideo }));
            setUploadFiles(prev => ({ ...prev, [index]: file }));
            if (isVideo) setPlayingVideos(prev => ({ ...prev, [index]: false }));
        }
    };

    const toggleVideoPlayback = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const slideEl = slideGridRefs.current[index];
        const video = slideEl?.querySelector('video');
        if (!video) return;
        if (video.paused) {
            video.play();
            setPlayingVideos(prev => ({ ...prev, [index]: true }));
        } else {
            video.pause();
            setPlayingVideos(prev => ({ ...prev, [index]: false }));
        }
    };

    const handleDownloadAll = async () => {
        setDownloadStatus('Preparing...');
        try {
            const zip = new jsZip();
            for (let i = 0; i < carouselData.slides.length; i++) {
                const padded = String(i + 1).padStart(2, '0');

                // Video slide — composite slide + video → .webm
                if (uploadTypes[i] && uploadFiles[i]) {
                    const el = exportRefs.current[i];
                    if (!el) { console.warn(`Export element ${i} not found`); continue; }
                    try {
                        const { blob, extension } = await recordVideoSlide(
                            el,
                            (msg) => setDownloadStatus(msg),
                        );
                        zip.file(`slide-${padded}.${extension}`, blob);
                    } catch (err) {
                        console.error(`Video slide ${i} recording failed, falling back to raw file`, err);
                        const file = uploadFiles[i];
                        const ext = file.name.split('.').pop() || 'mp4';
                        zip.file(`slide-${padded}.${ext}`, file);
                    }
                    continue;
                }

                // Image / no-upload slide — html2canvas → PNG
                setDownloadStatus(`Capturing slide ${i + 1}...`);
                const el = exportRefs.current[i];
                if (!el) { console.warn(`Export element ${i} not found`); continue; }
                const canvas = await html2canvas(el, { scale: 1, useCORS: true, backgroundColor: null, logging: false });
                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                if (blob) zip.file(`slide-${padded}.png`, blob);
            }
            setDownloadStatus('Packaging ZIP...');
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${post.theme.replace(/\s+/g, '-').toLowerCase()}-slides.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed', err);
            alert('Failed to generate slides. Please check console for errors.');
        } finally {
            setDownloadStatus(null);
        }
    };

    const updateSlide = (index: number, field: keyof SlideData, value: string) => {
        setCarouselData(prev => {
            const newSlides = [...prev.slides];
            newSlides[index] = { ...newSlides[index], [field]: value };
            return { ...prev, slides: newSlides };
        });
    };

    const activeSlide = editingSlideIndex !== null ? carouselData.slides[editingSlideIndex] : null;
    const availableLayouts = carouselData.style === 'tweet-thread' ? AUTHORITY_LAYOUTS : EDITORIAL_LAYOUTS;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Sidebar />

            <div className="pl-[260px] relative overflow-x-hidden">
                <div className="w-full max-w-[1700px] mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-[#262626] rounded-full transition-colors text-neutral-400 hover:text-white"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <h1 className="text-2xl font-bold font-['Sora']">Detalhes do Post</h1>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsPreviewOpen(true)}
                                className="border-2 border-white text-white px-4 py-2 rounded-[3px] shadow hover:bg-white/10 flex items-center gap-2 font-medium transition-colors text-sm"
                            >
                                <Eye className="w-4 h-4" />
                                Preview
                            </button>
                            <button
                                onClick={handleDownloadAll}
                                disabled={isDownloading}
                                className="bg-[#8a00c4] text-white px-4 py-2 rounded-[3px] shadow hover:bg-[#a000e0] disabled:opacity-50 flex items-center gap-2 font-medium transition-colors text-sm"
                            >
                                {isDownloading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {downloadStatus}
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Download Slides
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-8 items-start relative">
                        {/* Main Content - Slides */}
                        <div className="flex-1 w-full min-w-0 space-y-8">
                            {/* Slide Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {carouselData.slides.map((slide, index) => {
                                    const hasUpload = !!uploads[index];
                                    const isBlank = slide.image && !slide.image.url && !uploads[index];
                                    const isEditing = editingSlideIndex === index;

                                    return (
                                        <div key={index} className="flex flex-col gap-3" ref={el => { slideGridRefs.current[index] = el; }}>
                                            <div
                                                className={`bg-[#161616] border rounded-2xl overflow-hidden relative group cursor-pointer transition-all ${isEditing ? 'border-[#8a00c4] ring-1 ring-[#8a00c4]/50' : 'border-[#262626] hover:border-neutral-700'}`}
                                                onClick={() => setEditingSlideIndex(index)}
                                            >
                                                <ScaleWrapper>
                                                    <LivePreview
                                                        slide={slide}
                                                        carousel={carouselData}
                                                        slideIndex={index}
                                                        uploadedImage={uploads[index]}
                                                        uploadedIsVideo={!!uploadTypes[index]}
                                                    />
                                                </ScaleWrapper>

                                                {/* Play/Pause badge — visible when slide has a video upload */}
                                                {uploadTypes[index] && (
                                                    <button
                                                        onClick={(e) => toggleVideoPlayback(index, e)}
                                                        className="absolute top-2 right-2 z-30 p-1.5 bg-black/70 rounded-full text-white hover:bg-black/90 transition-colors shadow-lg"
                                                        title={playingVideos[index] ? 'Pause video' : 'Play video'}
                                                    >
                                                        {playingVideos[index] ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                                    </button>
                                                )}

                                                {/* Hover Overlay */}
                                                <div className={`absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] transition-all duration-200 ${isEditing || isBlank ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingSlideIndex(index);
                                                    }}
                                                >
                                                    <div className="flex flex-col gap-3 items-center">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingSlideIndex(index);
                                                                }}
                                                                className="p-3 bg-white rounded-full text-black hover:scale-110 transition-transform shadow-lg"
                                                                title="Edit Slide"
                                                            >
                                                                <Pencil className="w-5 h-5" />
                                                            </button>

                                                            <label className={`cursor-pointer p-3 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 ${isBlank ? 'bg-red-500 text-white animate-pulse' : 'bg-[#262626] text-white border border-[#404040]'}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <ImageIcon className="w-5 h-5" />
                                                                <input
                                                                    type="file"
                                                                    accept="image/*,video/*"
                                                                    className="hidden"
                                                                    onChange={(e) => handleUpload(index, e)}
                                                                />
                                                            </label>
                                                        </div>
                                                        <span className="text-sm font-medium text-white/90 drop-shadow-md">
                                                            {isEditing ? 'Editing...' : 'Click to Edit'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <span className={`text-sm font-medium px-3 py-1 rounded-full ${isEditing ? 'bg-[#8a00c4]/20 text-[#d685ff]' : 'text-neutral-500 bg-[#161616]'}`}>
                                                    Slide {index + 1}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Metadata Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#262626]">
                                {/* Profile Settings */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold font-['Sora'] text-white">Profile Branding</h3>
                                    <div className="bg-[#161616] rounded-2xl p-6 border border-[#262626] space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-400 mb-3">
                                                Avatar
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#262626]">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={carouselData.profile?.avatar_url || '/avatar.png'}
                                                        alt="Avatar"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <label className="cursor-pointer bg-[#262626] px-4 py-2 border border-[#404040] rounded-lg text-sm font-medium text-white hover:bg-[#333] transition-colors flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003 17v-3h14a3 3 0 003 17" />
                                                    </svg>
                                                    Change Image
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const url = URL.createObjectURL(file);
                                                                setCarouselData(prev => ({
                                                                    ...prev,
                                                                    profile: { ...prev.profile!, avatar_url: url }
                                                                }));
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-400 mb-2">
                                                    Display Name
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-sm text-white focus:ring-2 focus:ring-[#8a00c4] focus:border-transparent outline-none transition-all"
                                                    value={carouselData.profile?.display_name || ''}
                                                    onChange={(e) => setCarouselData(prev => ({
                                                        ...prev,
                                                        profile: { ...prev.profile!, display_name: e.target.value }
                                                    }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-400 mb-2">
                                                    Username (@)
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-sm text-white focus:ring-2 focus:ring-[#8a00c4] focus:border-transparent outline-none transition-all"
                                                    value={carouselData.profile?.username || ''}
                                                    onChange={(e) => setCarouselData(prev => ({
                                                        ...prev,
                                                        profile: { ...prev.profile!, username: e.target.value }
                                                    }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold font-['Sora'] text-white">Content Details</h3>
                                    <div className="bg-[#161616] rounded-2xl p-6 border border-[#262626] space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-400 mb-2">
                                                Caption
                                            </label>
                                            <textarea
                                                className="w-full h-32 px-4 py-3 bg-[#0a0a0a] border border-[#262626] rounded-lg text-sm text-white focus:ring-2 focus:ring-[#8a00c4] focus:border-transparent outline-none transition-all resize-none"
                                                value={carouselData.caption || ''}
                                                onChange={(e) => setCarouselData(prev => ({ ...prev, caption: e.target.value }))}
                                                placeholder="Enter post caption..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-neutral-400 mb-2">
                                                Hashtags
                                            </label>
                                            <textarea
                                                className="w-full h-24 px-4 py-3 bg-[#0a0a0a] border border-[#262626] rounded-lg text-sm text-[#8a00c4] font-medium focus:ring-2 focus:ring-[#8a00c4] focus:border-transparent outline-none transition-all resize-none"
                                                value={carouselData.hashtags?.join(' ') || ''}
                                                onChange={(e) => {
                                                    const tags = e.target.value.split(/\s+/).filter(t => t.length > 0);
                                                    setCarouselData(prev => ({ ...prev, hashtags: tags }));
                                                }}
                                                placeholder="#hashtag1 #hashtag2"
                                            />
                                            <p className="mt-2 text-xs text-neutral-500">Separate hashtags with spaces</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Editor Sidebar (Sticky) */}
                        <div className="w-[360px] flex-none hidden xl:block">
                            <div className="sticky top-8 space-y-6">
                                {/* Global Settings Panel (Theme & Colors) */}
                                <div className="bg-[#161616] rounded-2xl border border-[#262626] p-5 shadow-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-white font-['Sora']">Global Theme</h3>
                                    </div>

                                    {/* Theme Switcher */}
                                    {content_json && (
                                        <div className="mb-6">
                                            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Style</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {AVAILABLE_THEMES.map(theme => (
                                                    <button
                                                        key={theme.id}
                                                        onClick={() => handleThemeSwitch(theme.id as 'editorial' | 'authority')}
                                                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border flex items-center justify-center gap-2 ${currentThemeId === theme.id
                                                            ? 'bg-[#8a00c4] text-white border-[#8a00c4]'
                                                            : 'bg-[#262626] text-neutral-300 border-[#333] hover:border-[#555]'
                                                            }`}
                                                    >
                                                        {theme.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Font Settings */}
                                    {content_json && (
                                        <div className="mb-6">
                                            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Typography</div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-[10px] text-neutral-400 mb-1">Headline Font</label>
                                                    <select
                                                        value={carouselData.fonts.headline}
                                                        onChange={(e) => updateFont('headline', e.target.value)}
                                                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg text-xs text-white p-2 outline-none focus:border-[#8a00c4]"
                                                    >
                                                        {GOOGLE_FONTS.map(font => (
                                                            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-neutral-400 mb-1">Body Font</label>
                                                    <select
                                                        value={carouselData.fonts.body}
                                                        onChange={(e) => updateFont('body', e.target.value)}
                                                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg text-xs text-white p-2 outline-none focus:border-[#8a00c4]"
                                                    >
                                                        {GOOGLE_FONTS.map(font => (
                                                            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Color Palette */}
                                    <div>
                                        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Palette</div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { key: 'bg_primary', label: 'Bg 1' },
                                                { key: 'bg_secondary', label: 'Bg 2' },
                                                { key: 'accent', label: 'Accent' },
                                                { key: 'text_primary', label: 'Text' },
                                            ].map((colorItem) => (
                                                <div key={colorItem.key} className="flex flex-col gap-1">
                                                    <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-[#333]">
                                                        <input
                                                            type="color"
                                                            value={carouselData.color_palette[colorItem.key as keyof typeof carouselData.color_palette] as string}
                                                            onChange={(e) => updatePalette(colorItem.key as keyof typeof carouselData.color_palette, e.target.value)}
                                                            className="absolute inset-[-50%] w-[200%] h-[200%] p-0 cursor-pointer border-0"
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-neutral-500 text-center">{colorItem.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="mt-6 w-full flex items-center justify-center gap-2 bg-white text-black font-semibold px-4 py-3 rounded-lg hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save All Changes
                                    </button>
                                </div>

                                {/* Slide Editor Panel */}
                                {activeSlide ? (
                                    <div className="bg-[#161616] rounded-2xl border border-[#262626] p-5 shadow-xl animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#262626]">
                                            <h3 className="font-bold text-white font-['Sora']">Item {editingSlideIndex! + 1}</h3>
                                            <button
                                                onClick={() => setEditingSlideIndex(null)}
                                                className="text-neutral-500 hover:text-white transition-colors"
                                            >
                                                Close
                                            </button>
                                        </div>

                                        <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2 custom-scrollbar">
                                            {/* Headline */}
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Headline</label>
                                                <textarea
                                                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-sm text-white focus:ring-1 focus:ring-[#8a00c4] outline-none min-h-[60px]"
                                                    value={activeSlide.headline}
                                                    onChange={(e) => updateSlide(editingSlideIndex!, 'headline', e.target.value)}
                                                />
                                            </div>

                                            {/* Body/Markdown */}
                                            {(activeSlide.body_markdown || activeSlide.body !== null) && (
                                                <div>
                                                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Body Content</label>
                                                    <textarea
                                                        className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-sm text-white font-mono focus:ring-1 focus:ring-[#8a00c4] outline-none min-h-[120px]"
                                                        value={activeSlide.body_markdown || activeSlide.body || ''}
                                                        onChange={(e) => updateSlide(editingSlideIndex!, activeSlide.body_markdown ? 'body_markdown' : 'body', e.target.value)}
                                                        placeholder="Content here..."
                                                    />
                                                </div>
                                            )}

                                            {/* Subtitle */}
                                            {activeSlide.subtitle !== null && (
                                                <div>
                                                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Subtitle</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-sm text-white focus:ring-1 focus:ring-[#8a00c4] outline-none"
                                                        value={activeSlide.subtitle || ''}
                                                        onChange={(e) => updateSlide(editingSlideIndex!, 'subtitle', e.target.value)}
                                                    />
                                                </div>
                                            )}

                                            {/* Layout */}
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Layout</label>
                                                <select
                                                    value={activeSlide.layout}
                                                    onChange={(e) => updateSlide(editingSlideIndex!, 'layout', e.target.value)}
                                                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-sm text-white focus:ring-1 focus:ring-[#8a00c4] outline-none"
                                                >
                                                    {availableLayouts.map(layout => (
                                                        <option key={layout} value={layout}>{layout}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Typography Options */}
                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <div>
                                                    <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Title Size</label>
                                                    <select
                                                        value={activeSlide.font_size_headline || '48px'}
                                                        onChange={(e) => updateSlide(editingSlideIndex!, 'font_size_headline', e.target.value)}
                                                        className="w-full bg-[#0a0a0a] border border-[#333] rounded text-xs text-white p-1.5"
                                                    >
                                                        {HEADLINE_SIZES.map(size => (
                                                            <option key={size} value={size}>{size}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Body Size</label>
                                                    <select
                                                        value={activeSlide.font_size_body || '24px'}
                                                        onChange={(e) => updateSlide(editingSlideIndex!, 'font_size_body', e.target.value)}
                                                        className="w-full bg-[#0a0a0a] border border-[#333] rounded text-xs text-white p-1.5"
                                                    >
                                                        {BODY_SIZES.map(size => (
                                                            <option key={size} value={size}>{size}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Visual Overrides */}
                                            <div className="pt-4 border-t border-[#262626]">
                                                <h4 className="text-xs font-bold text-neutral-400 uppercase mb-3">Slide Overrides</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] text-neutral-500 mb-1">Bg Color</label>
                                                        <div className="flex bg-[#0a0a0a] border border-[#333] rounded p-1">
                                                            <input
                                                                type="color"
                                                                value={activeSlide.bg_color}
                                                                onChange={(e) => updateSlide(editingSlideIndex!, 'bg_color', e.target.value)}
                                                                className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                                                            />
                                                            <span className="ml-2 text-xs text-neutral-400 self-center">{activeSlide.bg_color}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-neutral-500 mb-1">Text Color</label>
                                                        <div className="flex bg-[#0a0a0a] border border-[#333] rounded p-1">
                                                            <input
                                                                type="color"
                                                                value={activeSlide.text_color}
                                                                onChange={(e) => updateSlide(editingSlideIndex!, 'text_color', e.target.value)}
                                                                className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                                                            />
                                                            <span className="ml-2 text-xs text-neutral-400 self-center">{activeSlide.text_color}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-[#161616] rounded-2xl border border-[#262626] p-8 text-center text-neutral-500">
                                        <p>Select a slide to edit</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Hidden High-Res Export Container */}
            <div style={{ position: 'fixed', left: '-10000px', top: 0, opacity: 0, pointerEvents: 'none' }}>
                {carouselData.slides.map((slide, index) => (
                    <div
                        key={`export-${index}`}
                        ref={el => { exportRefs.current[index] = el }}
                        style={{
                            width: 1080,
                            height: 1350,
                        }}
                    >
                        <LivePreview
                            slide={slide}
                            carousel={carouselData}
                            slideIndex={index}
                            uploadedImage={uploads[index]}
                            uploadedIsVideo={!!uploadTypes[index]}
                        />
                    </div>
                ))}
            </div>
            {/* Preview Modal */}
            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                carouselData={carouselData}
                uploads={uploads}
                uploadTypes={uploadTypes}
            />
        </div >
    );
}
