// Smoky Text — Originkit
// Using component defaults.

import { useMemo, useEffect, useRef, useState, useCallback } from "react"

type Position = "bottomLeft" | "topLeft"
type AnimationMode = "singleLine" | "multiLine" | "inPlace"
type Phase = "hidden" | "appearing" | "visible"

interface CharEntry {
    char: string
    globalIdx: number
    posInLine: number
    lineIdx: number
}

interface Group {
    type: "word" | "space" | "newline"
    chars: CharEntry[]
    lineIdx: number
    gi: number
}

interface VLI {
    charVL: Map<number, number>
    charVLPos: Map<number, number>
    vlLen: Map<number, number>
}

function buildGroups(text: string) {
    const lines = text.split("\n")
    const groups: Group[] = []
    let globalIdx = 0,
        gi = 0
    lines.forEach((line, lineIdx) => {
        let posInLine = 0
        ;(line.match(/\S+|\s+/g) ?? []).forEach((seg) => {
            groups.push({
                type: /^\s/.test(seg) ? "space" : "word",
                chars: seg.split("").map((c) => ({
                    char: c,
                    globalIdx: globalIdx++,
                    posInLine: posInLine++,
                    lineIdx,
                })),
                lineIdx,
                gi: gi++,
            })
        })
        if (lineIdx < lines.length - 1)
            groups.push({ type: "newline", chars: [], lineIdx, gi: gi++ })
    })
    return { groups, totalVisible: globalIdx }
}

function rawDelay(
    c: CharEntry,
    total: number,
    pos: Position,
    mode: AnimationMode,
    vli: VLI | null
): number {
    const S = 0.1
    if (mode === "inPlace") return 0 // all chars appear simultaneously
    if (mode === "multiLine" && vli) {
        const p = vli.charVLPos.get(c.globalIdx) ?? 0
        return p * S // per-line, left → right stagger
    }
    return c.globalIdx * S // sequential stagger
}

function rawAppearDelay(
    c: CharEntry,
    total: number,
    pos: Position,
    mode: AnimationMode,
    vli: VLI | null,
    maxRaw: number
): number {
    return rawDelay(c, total, pos, mode, vli)
}

function scaledTiming(
    rawD: number,
    maxRaw: number,
    duration: number
): { delay: number; charDur: number } {
    if (maxRaw <= 0) return { delay: 0, charDur: duration }
    return {
        charDur: duration * 0.5,
        delay: (rawD * (duration * 0.5)) / maxRaw,
    }
}

function getAppear(
    c: CharEntry,
    total: number,
    pos: Position,
    mode: AnimationMode,
    vli: VLI | null
): string {
    const e = c.globalIdx % 2 === 0
    if (mode === "inPlace") return e ? "smt-ap-c-a" : "smt-ap-c-b"
    if (pos === "topLeft") return e ? "smt-ap-tl-a" : "smt-ap-tl-b"
    return e ? "smt-ap-bl-a" : "smt-ap-bl-b" // bottomLeft
}

function parseT(t: any, def: { duration: number; delay: number }) {
    const EASES: Record<string, string> = {
        linear: "linear",
        easeIn: "cubic-bezier(0.42,0,1,1)",
        easeOut: "cubic-bezier(0,0,0.58,1)",
        easeInOut: "cubic-bezier(0.42,0,0.58,1)",
    }
    if (!t)
        return {
            duration: def.duration,
            delay: def.delay,
            timing: "cubic-bezier(0,0,0.58,1)",
        }
    if (t.type === "spring")
        return {
            duration: 1.5,
            delay: t.delay ?? def.delay,
            timing: "cubic-bezier(0.175,0.885,0.32,1.275)",
        }
    return {
        duration: typeof t.duration === "number" ? t.duration : def.duration,
        delay: typeof t.delay === "number" ? t.delay : def.delay,
        timing: Array.isArray(t.ease)
            ? `cubic-bezier(${(t.ease as number[]).map((v) => +v.toFixed(4)).join(",")})`
            : (EASES[String(t.ease)] ?? "cubic-bezier(0,0,0.58,1)"),
    }
}

// intensity 1 = crisp quick puff, intensity 20 = heavy diffuse smoke
function buildKF(color: string, intensity: number) {
    const n = (Math.max(1, Math.min(20, intensity)) - 1) / 19 // 0–1
    const r = (v: number) => +v.toFixed(2)

    // blur radii: near-crisp at 1, heavy at 20
    const peakB = Math.round(6 + n * 200) // 6px → 206px
    const initB = Math.round(2 + n * 70) // 2px → 72px

    // density: stack more shadow layers as intensity climbs → real "mass"
    const layers = 1 + Math.round(n * 3) // 1 → 4 layers
    const stack = (blur: number) =>
        Array.from(
            { length: layers },
            (_, i) => `0 0 ${Math.round((blur * (i + 1)) / layers)}px ${color}`
        ).join(",")
    const peak = stack(peakB)
    const init = stack(initB)

    // dispersion: fly further at high intensity
    const d = 0.7 + n * 0.8 // distance mult 0.7 → 1.5
    // in-place: start as a big diffuse smoke cloud (peak blur, scaled out) and
    // COMPRESS inward into the crisp letter. Both variants scale down (>1 → 1)
    // so the smoke contracts inward, never expands outside.
    const ic = r(1.3 + n * 0.5) // 1.3 → 1.8 (even chars)
    const ic2 = r(1.15 + n * 0.35) // 1.15 → 1.5 (odd chars)

    return `
@keyframes smt-ap-c-a{from{opacity:0;text-shadow:${init};transform:scale(${ic})}40%{text-shadow:${peak}}to{opacity:1;text-shadow:0 0 0 ${color};transform:none}}
@keyframes smt-ap-c-b{from{opacity:0;text-shadow:${init};transform:scale(${ic2})}40%{text-shadow:${peak}}to{opacity:1;text-shadow:0 0 0 ${color};transform:none}}
@keyframes smt-ap-bl-a{from{opacity:0;text-shadow:${init};transform:translate3d(${r(-15 * d)}rem,${r(8 * d)}rem,0) rotate(40deg) skewX(-70deg) scale(0.7)}40%{text-shadow:${peak}}to{opacity:1;text-shadow:0 0 0 ${color};transform:none}}
@keyframes smt-ap-bl-b{from{opacity:0;text-shadow:${init};transform:translate3d(${r(-18 * d)}rem,${r(8 * d)}rem,0) rotate(40deg) skewX(70deg) scale(0.5)}40%{text-shadow:${peak}}to{opacity:1;text-shadow:0 0 0 ${color};transform:none}}
@keyframes smt-ap-tl-a{from{opacity:0;text-shadow:${init};transform:translate3d(${r(-15 * d)}rem,${r(-8 * d)}rem,0) rotate(-40deg) skewX(70deg) scale(0.7)}40%{text-shadow:${peak}}to{opacity:1;text-shadow:0 0 0 ${color};transform:none}}
@keyframes smt-ap-tl-b{from{opacity:0;text-shadow:${init};transform:translate3d(${r(-18 * d)}rem,${r(-8 * d)}rem,0) rotate(-40deg) skewX(-70deg) scale(0.5)}40%{text-shadow:${peak}}to{opacity:1;text-shadow:0 0 0 ${color};transform:none}}
`
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 300
 */
export default function SmokyText(__props) {
    const {
        text = "SMOKY\nTEXT",
        font = {} as any,
        color = "whitesmoke",
        appearTrigger = "default" as "default" | "hover" | "scroll",
        scrollConfig = {} as any,
        appearTransition = undefined as any,
        intensity = 10,
        position = "bottomLeft" as Position,
        animationMode = "singleLine" as AnimationMode,
    } = { ...COMPONENT_DEFAULTS, ...__props }
    const kfEl = useRef<HTMLStyleElement | null>(null)
    useEffect(() => {
        kfEl.current = document.createElement("style")
        document.head.appendChild(kfEl.current)
        return () => {
            kfEl.current?.remove()
            kfEl.current = null
        }
    }, [])
    useEffect(() => {
        if (kfEl.current) kfEl.current.textContent = buildKF(color, intensity)
    }, [color, intensity])

    const { groups, totalVisible } = useMemo(() => buildGroups(text), [text])
    const appearT = useMemo(
        () => parseT(appearTransition, { duration: 2, delay: 0 }),
        [JSON.stringify(appearTransition)]
    )

    const containerRef = useRef<HTMLDivElement>(null)
    const wordRefs = useRef(new Map<number, HTMLElement>())
    const [vli, setVli] = useState<VLI | null>(null)

    const measureVL = useCallback(() => {
        if (animationMode !== "multiLine") {
            setVli(null)
            return
        }
        const items: { top: number; gi: number; chars: CharEntry[] }[] = []
        groups.forEach((g) => {
            if (g.type === "newline" || !g.chars.length) return
            const el = wordRefs.current.get(g.gi)
            if (el) items.push({ top: el.offsetTop, gi: g.gi, chars: g.chars })
        })
        items.sort((a, b) => a.gi - b.gi)
        const tops = [...new Set(items.map((i) => i.top))].sort((a, b) => a - b)
        const topToVL = new Map(tops.map((t, i) => [t, i]))
        const charVL = new Map<number, number>(),
            charVLPos = new Map<number, number>()
        const vlLen = new Map<number, number>(),
            vlPos = new Map<number, number>()
        items.forEach(({ top, chars }) => {
            const vl = topToVL.get(top) ?? 0
            chars.forEach((c) => {
                const p = vlPos.get(vl) ?? 0
                charVL.set(c.globalIdx, vl)
                charVLPos.set(c.globalIdx, p)
                vlPos.set(vl, p + 1)
                vlLen.set(vl, p + 1)
            })
        })
        setVli({ charVL, charVLPos, vlLen })
    }, [groups, animationMode])

    useEffect(() => {
        measureVL()
        if (!containerRef.current) return
        const ro = new ResizeObserver(measureVL)
        ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [measureVL])

    const maxRaw = useMemo(() => {
        let m = 0
        groups.forEach((g) =>
            g.chars.forEach((c) => {
                const d = rawDelay(
                    c,
                    totalVisible,
                    position,
                    animationMode,
                    vli
                )
                if (d > m) m = d
            })
        )
        return m
    }, [groups, totalVisible, position, animationMode, vli])

    const [phase, setPhase] = useState<Phase>("hidden")
    const tRef = useRef<ReturnType<typeof setTimeout>[]>([])
    const clear = () => {
        tRef.current.forEach(clearTimeout)
        tRef.current = []
    }
    const later = (fn: () => void, ms: number) =>
        tRef.current.push(setTimeout(fn, ms))

    const apRef = useRef(appearT)
    apRef.current = appearT
    const hoverFiredRef = useRef(false)
    const scrollPos = (scrollConfig?.position ?? "bottom") as "top" | "bottom"
    const scrollDist = Math.max(0, Math.min(100, scrollConfig?.distance ?? 20))

    // Run the smoke-in once: hidden → appearing → hold on visible.
    const runAppear = useCallback(() => {
        clear()
        const ap = apRef.current
        setPhase("hidden")
        later(
            () => {
                setPhase("appearing")
                later(() => setPhase("visible"), ap.duration * 1000 + 200)
            },
            Math.max(ap.delay * 1000, 80)
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        clear()
        // Default → play on mount.
        if (appearTrigger === "default") {
            runAppear()
            return clear
        }
        // Hover / scroll → stay hidden until triggered.
        hoverFiredRef.current = false
        setPhase("hidden")
        if (appearTrigger === "scroll") {
            const el = containerRef.current
            if (!el) return clear
            // top → line `distance`% down from the TOP; fire when the
            //   component's TOP edge reaches it (touches the top distance% band).
            // bottom → line `distance`% up from the BOTTOM; fire when the
            //   component's BOTTOM edge reaches it.
            const check = () => {
                const vh =
                    window.innerHeight || document.documentElement.clientHeight
                const rect = el.getBoundingClientRect()
                if (scrollPos === "top") {
                    return rect.top <= vh * (scrollDist / 100)
                }
                return rect.bottom <= vh * (1 - scrollDist / 100)
            }
            if (check()) {
                runAppear()
                return clear
            }
            const onScroll = () => {
                if (check()) {
                    runAppear()
                    window.removeEventListener("scroll", onScroll, true)
                    window.removeEventListener("resize", onScroll)
                }
            }
            window.addEventListener("scroll", onScroll, true)
            window.addEventListener("resize", onScroll)
            return () => {
                window.removeEventListener("scroll", onScroll, true)
                window.removeEventListener("resize", onScroll)
                clear()
            }
        }
        // Hover → mouseenter on the container drives runAppear (see handlers).
        return clear
    }, [
        text,
        color,
        intensity,
        position,
        animationMode,
        appearTrigger,
        scrollPos,
        scrollDist,
        JSON.stringify(appearT),
        runAppear,
    ])

    const fontAny = font as any
    const textAlign = (fontAny?.textAlign ?? "center") as string
    const justify =
        textAlign === "right"
            ? "flex-end"
            : textAlign === "center"
              ? "center"
              : "flex-start"

    return (
        <div
            ref={containerRef}
            onMouseEnter={() => {
                // Hover → play once on first enter, then stay visible.
                if (appearTrigger === "hover" && !hoverFiredRef.current) {
                    hoverFiredRef.current = true
                    runAppear()
                }
            }}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: justify,
                overflow: "",
            }}
        >
            <div
                style={{
                    ...fontAny,
                    color: "transparent",
                    backfaceVisibility: "hidden",
                    userSelect: "none",
                    textAlign: textAlign as any,
                    wordBreak: "keep-all",
                    overflowWrap: "normal",
                }}
            >
                {groups.map((group) => {
                    if (group.type === "newline") return <br key={group.gi} />
                    if (group.type === "space")
                        return (
                            <span
                                key={group.gi}
                                ref={(el) => {
                                    if (el) wordRefs.current.set(group.gi, el)
                                }}
                                style={{ display: "inline", whiteSpace: "pre" }}
                            >
                                {" "}
                            </span>
                        )

                    return (
                        <span
                            key={group.gi}
                            ref={(el) => {
                                if (el) wordRefs.current.set(group.gi, el)
                            }}
                            style={{
                                display: "inline-block",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {group.chars.map((c) => {
                                const base: React.CSSProperties = {
                                    display: "inline-block",
                                    textShadow: `0 0 0 ${color}`,
                                }

                                if (phase === "hidden")
                                    return (
                                        <span
                                            key={c.globalIdx}
                                            style={{ ...base, opacity: 0 }}
                                        >
                                            {c.char}
                                        </span>
                                    )

                                if (phase === "visible")
                                    return (
                                        <span
                                            key={c.globalIdx}
                                            style={{ ...base, opacity: 1 }}
                                        >
                                            {c.char}
                                        </span>
                                    )

                                if (phase === "appearing") {
                                    const rd = rawAppearDelay(
                                        c,
                                        totalVisible,
                                        position,
                                        animationMode,
                                        vli,
                                        maxRaw
                                    )
                                    const { delay, charDur } = scaledTiming(
                                        rd,
                                        maxRaw,
                                        appearT.duration
                                    )
                                    const anim = getAppear(
                                        c,
                                        totalVisible,
                                        position,
                                        animationMode,
                                        vli
                                    )
                                    return (
                                        <span
                                            key={c.globalIdx}
                                            style={{
                                                ...base,
                                                animation: `${anim} ${charDur}s ${delay}s ${appearT.timing} both`,
                                            }}
                                        >
                                            {c.char}
                                        </span>
                                    )
                                }

                                return null
                            })}
                        </span>
                    )
                })}
            </div>
        </div>
    )
}

const COMPONENT_DEFAULTS = {
    text: "SMOKY\nTEXT",
    font: {
        fontFamily: "Inter",
        variant: "bold",
        fontSize: 120,
        textAlign: "center",
    } as any,
    color: "whitesmoke",
    appearTrigger: "default",
    scrollConfig: {
        position: "bottom",
        distance: 20,
    },
    appearTransition: { type: "tween", ease: "easeOut", duration: 2, delay: 0 },
    intensity: 10,
    animationMode: "singleLine",
    position: "bottomLeft",
}


# Background animation(make it black)
"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LightLinesProps {
    /** Additional CSS classes */
    className?: string;
    /** Lines opacity (0-1) */
    linesOpacity?: number;
    /** Lights opacity (0-1) */
    lightsOpacity?: number;
    /** Animation speed multiplier */
    speedMultiplier?: number;
    /** Primary gradient color (from) */
    gradientFrom?: string;
    /** Primary gradient color (to) */
    gradientTo?: string;
    /** Light color */
    lightColor?: string;
    /** Line color */
    lineColor?: string;
    /** Children content to overlay */
    children?: React.ReactNode;
}

interface AnimatedLightRef {
    element: SVGPathElement | null;
    from: number;
    to: number;
    duration: number;
}

export function LightLines({
    className,
    linesOpacity = 0.05,
    lightsOpacity = 0.9,
    speedMultiplier = 1,
    gradientFrom = "#2462F6",
    gradientTo = "#5999F8",
    lightColor = "#fff",
    lineColor = "#fff",
    children,
}: LightLinesProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const animationsRef = useRef<AnimatedLightRef[]>([]);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        // Light elements configuration
        const lightsDown = [
            { selector: ".light4", from: -1080, to: 1080 },
            { selector: ".light5", from: -1080, to: 1080 },
            { selector: ".light6", from: -1080, to: 1080 },
            { selector: ".light7", from: -1080, to: 1080 },
            { selector: ".light8", from: -1080, to: 1080 },
            { selector: ".light11", from: -1080, to: 1080 },
            { selector: ".light12", from: -1080, to: 1080 },
            { selector: ".light13", from: -1080, to: 1080 },
            { selector: ".light14", from: -1080, to: 1080 },
            { selector: ".light15", from: -1080, to: 1080 },
            { selector: ".light16", from: -1080, to: 1080 },
        ];

        const lightsUp = [
            { selector: ".light1", from: 1080, to: -1080 },
            { selector: ".light2", from: 1080, to: -1080 },
            { selector: ".light3", from: 1080, to: -1080 },
            { selector: ".light9", from: 1080, to: -1080 },
            { selector: ".light10", from: 1080, to: -1080 },
            { selector: ".light17", from: 1080, to: -1080 },
        ];

        const container = containerRef.current;
        if (!container) return;

        // Initialize animations
        const allLights = [...lightsDown, ...lightsUp];
        animationsRef.current = allLights.map((light) => {
            const element = container.querySelector(light.selector) as SVGPathElement | null;
            const duration = (Math.floor(Math.random() * 59) + 2) * 0.5 + 0.5;
            return {
                element,
                from: light.from,
                to: light.to,
                duration: duration / speedMultiplier,
            };
        });

        // Animation state for each light
        const animationState = animationsRef.current.map(() => ({
            startTime: performance.now() - Math.random() * 5000, // Stagger start times
            currentY: 0,
        }));

        let isVisible = false;

        const animate = (time: number) => {
            if (!isVisible) {
                frameRef.current = requestAnimationFrame(animate);
                return;
            }

            animationsRef.current.forEach((ref, index) => {
                if (!ref.element) return;

                const state = animationState[index];
                const elapsed = (time - state.startTime) / 1000; // Convert to seconds
                const progress = (elapsed % ref.duration) / ref.duration;
                const currentY = ref.from + (ref.to - ref.from) * progress;

                ref.element.style.transform = `translateY(${currentY}px)`;
            });

            frameRef.current = requestAnimationFrame(animate);
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisible = entry.isIntersecting;
            },
            { threshold: 0 }
        );

        observer.observe(container);

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
            observer.disconnect();
        };
    }, [speedMultiplier]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "absolute inset-0 h-full w-full flex justify-center overflow-hidden",
                className
            )}
            style={{
                background: `linear-gradient(180deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
            }}
        >
            <svg
                className="absolute h-full"
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                viewBox="0 0 1920 1080"
                preserveAspectRatio="none"
            >
                {/* Static Lines */}
                <g className="lines" style={{ opacity: linesOpacity }}>
                    <rect
                        className="line"
                        x="1253.6"
                        width="4.5"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="873.3"
                        width="1.8"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="1100"
                        width="1.8"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="1547.1"
                        width="4.5"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="615"
                        width="4.5"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="684.6"
                        width="1.8"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="1369.4"
                        width="1.8"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="1310.2"
                        width="0.9"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="1233.4"
                        width="0.9"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="124.2"
                        width="0.9"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="1818.4"
                        width="4.5"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="70.3"
                        width="4.5"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="1618.6"
                        width="1.8"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="455.9"
                        width="1.8"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="328.7"
                        width="1.8"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="300.8"
                        width="4.6"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                    <rect
                        className="line"
                        x="1666.4"
                        width="0.9"
                        height="1080"
                        style={{ fill: lineColor, fillRule: "evenodd", clipRule: "evenodd" }}
                    />
                </g>

                {/* Animated Lights */}
                <g className="lights" style={{ opacity: lightsOpacity }}>
                    <path
                        className="light1 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M619.5,298.4H615v19.5h4.5V298.4z M619.5,674.8H615v9.8h4.5V674.8z M619.5,135.1H615v5.6h4.5V135.1z M619.5,55.5H615v68.7h4.5V55.5z"
                    />
                    <path
                        className="light2 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M1258.2,531.9h-4.5v8.1h4.5V531.9z M1258.2,497.9h-4.5v17.9h4.5V497.9z M1258.2,0h-4.5v25.3h4.5V0z M1258.2,252.2h-4.5v42.4h4.5V252.2z"
                    />
                    <path
                        className="light3 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M875.1,123.8h-1.8v4h1.8V123.8z M875.1,289.4h-1.8v24.1h1.8V289.4z M875.1,0h-1.8v31.4h1.8V0z M875.1,50.2h-1.8v11.5h1.8V50.2z"
                    />
                    <path
                        className="light4 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M1101.8,983.8h-1.8v8.2h1.8V983.8z M1101.8,1075.9h-1.8v4.1h1.8V1075.9z M1101.8,873.7h-1.8v4.2h1.8V873.7z M1101.8,851h-1.8v18.2h1.8V851z"
                    />
                    <path
                        className="light5 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M686.4,822.7h-1.8v3.8h1.8V822.7z M686.4,928.4h-1.8v23h1.8V928.4z M686.4,1043.8h-1.8v36.2h1.8V1043.8z"
                    />
                    <path
                        className="light6 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M1551.6,860.9h-4.4v-34.1h4.4V860.9z M1551.6,533.5h-4.4v-13.9h4.4V533.5z M1551.6,1080h-4.4v-89.1h4.4V1080z"
                    />
                    <path
                        className="light7 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M1311.1,707.7h-0.9V698h0.9V707.7z M1311.1,436.8h-0.9v-58.9h0.9V436.8z M1311.1,140.7h-0.9V48h0.9V140.7z"
                    />
                    <path
                        className="light8 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M125.1,514.5h-0.9v-9.7h0.9V514.5z M125.1,243.6h-0.9v-58.9h0.9V243.6z"
                    />
                    <path
                        className="light9 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M305.4,806.7h-4.6v-42.5h4.6V806.7z M305.4,398.5h-4.6v-17.3h4.6V398.5z M305.4,1080h-4.6V968.8h4.6V1080z"
                    />
                    <path
                        className="light10 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M1822.9,170.7h-4.5v13.7h4.5V170.7z M1822.9,435.1h-4.5v6.8h4.5V435.1z M1822.9,55.9h-4.5v4h4.5V55.9z M1822.9,0h-4.5v48.3h4.5V0z"
                    />
                    <path
                        className="light11 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M1666.4,331.5h0.9v9.7h-0.9V331.5z M1666.4,602.4h0.9v58.9h-0.9V602.4z M1666.4,898.5h0.9v92.7h-0.9V898.5z"
                    />
                    <path
                        className="light12 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M1620.4,200.7h-1.8v6.4h1.8V200.7z M1620.4,469.1h-1.8v39h1.8V469.1z M1620.4,0h-1.8v51h1.8V0z M1620.4,81.3h-1.8V100h1.8V81.3z"
                    />
                    <path
                        className="light13 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M74.8,201h-4.5v16.2h4.5V201z M74.8,512.3h-4.5v8.1h4.5V512.3z M74.8,65.8h-4.5v4.6h4.5V65.8z M74.8,0h-4.5v56.8h4.5V0z"
                    />
                    <path
                        className="light14 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M1371.2,655.3h-1.8v6.3h1.8V655.3z M1371.2,829.7h-1.8v37.9h1.8V829.7z M1371.2,1020.3h-1.8v59.7h1.8V1020.3z"
                    />
                    <path
                        className="light15 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M1234.3,898.1h-0.9v-4.9h0.9V898.1z M1234.3,762.5h-0.9v-29.5h0.9V762.5z M1234.3,614.4h-0.9v-46.4h0.9V614.4z"
                    />
                    <path
                        className="light16 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M457.7,1010.8h-1.8v-18.1h1.8V1010.8z M457.7,507.5h-1.8V398h1.8V507.5z"
                    />
                    <path
                        className="light17 light"
                        style={{ fill: lightColor, fillRule: "evenodd", clipRule: "evenodd" }}
                        d="M330.5,170.7h-1.8v13.7h1.8V170.7z M330.5,435.1h-1.8v6.8h1.8V435.1z M330.5,55.9h-1.8v4h1.8V55.9z M330.5,0h-1.8v48.3h1.8V0z"
                    />
                </g>
            </svg>

            {/* Content overlay */}
            {children && (
                <div className="relative z-10 w-full h-full">{children}</div>
            )}
        </div>
    );
}

export default LightLines;
