export default function SetupLayout({ children }: { children: React.ReactNode }) {
    // Focused Layout is applied inside the page components for finer control,
    // or we can use a wrapper here. 
    // Story 1.3 says "Create route layouts... to suppress sidebar".
    // Since the main RootLayout imports Sidebar, we might need to conditionally render it there,
    // OR this layout segments the route. 
    // If RootLayout has Sidebar, this nested layout renders INSIDE it.
    // To remove Sidebar for specific routes without changing RootLayout logic (which checks pathname?),
    // we usually rely on RootLayout checking pathname or using a Route Group.
    // However, the current root layout wraps children in Contexts.
    // Let's check root layout again.
    return <>{children}</>;
}
