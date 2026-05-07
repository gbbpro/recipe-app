"use client";

import { CSSProperties } from "react";
import React from "react";

type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: CSSProperties;
};

export function Skeleton({
  width = "100%",
  height = "16px",
  borderRadius = "4px",
  style,
}: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background:
          "linear-gradient(90deg, var(--border) 25%, var(--tag-bg) 50%, var(--border) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.4s ease infinite",
        ...style,
      }}
    />
  );
}

// ─── Pre-built skeletons for common patterns ──────────────────────────────────

export function RecipeCardSkeleton() {
  return (
    <div
      style={{
        padding: "16px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
      }}
    >
      <Skeleton height="14px" width="80%" style={{ marginBottom: "8px" }} />
      <Skeleton height="14px" width="60%" style={{ marginBottom: "12px" }} />
      <div style={{ display: "flex", gap: "6px" }}>
        <Skeleton height="20px" width="50px" borderRadius="999px" />
        <Skeleton height="20px" width="60px" borderRadius="999px" />
        <Skeleton height="20px" width="45px" borderRadius="999px" />
      </div>
    </div>
  );
}

export function RecipeGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "12px",
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RecipeDetailSkeleton() {
  return (
    <main style={{ padding: "48px 0 80px" }}>
      <div className="container" style={{ maxWidth: "760px" }}>
        {/* Back link */}
        <Skeleton
          height="14px"
          width="120px"
          style={{ marginBottom: "32px" }}
        />

        {/* Header */}
        <div
          style={{
            marginBottom: "32px",
            paddingBottom: "32px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Skeleton
            height="36px"
            width="70%"
            style={{ marginBottom: "12px" }}
          />
          <Skeleton
            height="28px"
            width="50%"
            style={{ marginBottom: "20px" }}
          />
          <div style={{ display: "flex", gap: "6px" }}>
            <Skeleton height="24px" width="60px" borderRadius="999px" />
            <Skeleton height="24px" width="70px" borderRadius="999px" />
            <Skeleton height="24px" width="55px" borderRadius="999px" />
          </div>
        </div>

        {/* Two column */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "48px",
          }}
        >
          {/* Ingredients */}
          <div>
            <Skeleton
              height="12px"
              width="80px"
              style={{ marginBottom: "16px" }}
            />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton
                key={i}
                height="14px"
                width={
                  ["85%", "70%", "90%", "75%", "80%", "65%", "88%", "72%"][
                    i % 8
                  ]
                }
                style={{ marginBottom: "10px" }}
              />
            ))}
          </div>
          {/* Instructions */}
          <div>
            <Skeleton
              height="12px"
              width="90px"
              style={{ marginBottom: "16px" }}
            />
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: "16px", marginBottom: "20px" }}
              >
                <Skeleton
                  height="24px"
                  width="24px"
                  borderRadius="50%"
                  style={{ flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <Skeleton
                    height="14px"
                    width="100%"
                    style={{ marginBottom: "6px" }}
                  />
                  <Skeleton
                    height="14px"
                    width="90%"
                    style={{ marginBottom: "6px" }}
                  />
                  <Skeleton height="14px" width="75%" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export function HomePageSkeleton() {
  return (
    <div style={{ padding: "48px 0" }}>
      <div className="container">
        <Skeleton
          height="12px"
          width="140px"
          style={{ marginBottom: "20px" }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "10px",
            marginBottom: "48px",
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} height="48px" borderRadius="4px" />
          ))}
        </div>
        <Skeleton
          height="12px"
          width="100px"
          style={{ marginBottom: "16px" }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <RecipeCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PlannerSkeleton() {
  return (
    <main style={{ padding: "40px 0 80px" }}>
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}
        >
          <div>
            <Skeleton
              height="28px"
              width="180px"
              style={{ marginBottom: "8px" }}
            />
            <Skeleton height="14px" width="220px" />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Skeleton height="36px" width="70px" borderRadius="4px" />
            <Skeleton height="36px" width="90px" borderRadius="4px" />
            <Skeleton height="36px" width="70px" borderRadius="4px" />
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "80px repeat(7, 1fr)",
            gap: "8px",
          }}
        >
          <div />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} height="48px" borderRadius="4px" />
          ))}
          {Array.from({ length: 3 }).map((_, row) => (
            <React.Fragment key={`row-${row}`}>
              <Skeleton
                key={`label-${row}`}
                height="40px"
                width="60px"
                style={{ marginLeft: "auto" }}
              />
              {Array.from({ length: 7 }).map((_, col) => (
                <Skeleton
                  key={`cell-${row}-${col}`}
                  height="80px"
                  borderRadius="4px"
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </main>
  );
}
