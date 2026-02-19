export function BackgroundLogo() {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-0 pointer-events-none select-none overflow-hidden">
            <div className="relative h-[70vh] w-[70vh] opacity-10">
                <img
                    src="/logo.png"
                    alt="Shadowfeed Logo"
                    className="object-contain h-full w-full"
                    draggable={false}
                />
            </div>
        </div>
    );
}
