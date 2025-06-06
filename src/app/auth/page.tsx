"use client";

import React, { Suspense } from "react";
import Auth from "@/features/auth/auth";

export default function AuthPage() {
    return (
        <Suspense fallback={null}>
            <Auth />
        </Suspense>
    );
}