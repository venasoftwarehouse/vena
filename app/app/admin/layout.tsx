import type React from "react"
import { Toaster } from "sonner";

export default function AppRootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Toaster />
            {children}
        </>
    );
}
