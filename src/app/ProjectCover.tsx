import { useEffect, useRef, useState } from "react";
import type { Project } from "../core/model";
import { Icon } from "./Icon";

// Keep large source-image decodes sequential when a library contains many projects.
let coverQueue: Promise<unknown> = Promise.resolve();

export function ProjectCover({ project }: { project: Project }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px" },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || !project.shots.length) return;
    const controller = new AbortController();
    let objectUrl: string | undefined;
    setSource(null);
    coverQueue = coverQueue
      .catch(() => {})
      .then(async () => {
        if (controller.signal.aborted) return;
        const { renderProjectCover } = await import("./project-cover-renderer");
        const blob = await renderProjectCover(project, controller.signal);
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setSource(objectUrl);
      })
      .catch(() => {
        /* A missing preview never prevents opening the project. */
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [visible, project]);
  return (
    <div
      ref={ref}
      className="project-cover"
      style={{ background: project.style.background }}
      aria-hidden="true"
    >
      {source ? <img src={source} alt="" /> : <Icon name="layout" size={38} />}
    </div>
  );
}
