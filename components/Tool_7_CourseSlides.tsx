import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, SectionTitle } from './UI';

type CourseManifest = {
    courses?: Course[];
};

type Course = {
    id: string;
    title: string;
    description?: string;
    slidesPath: string;
    slides: string[];
};

const MANIFEST_URL = '/course-slides/slides.json';

export const Tool_CourseSlides: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [activeCourseId, setActiveCourseId] = useState('');
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        fetch(MANIFEST_URL, { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) throw new Error('Arquivo de slides nao encontrado.');
                return response.json() as Promise<CourseManifest>;
            })
            .then((manifest) => {
                if (!isMounted) return;

                const loadedCourses = (manifest.courses || []).filter(course =>
                    course.id &&
                    course.title &&
                    course.slidesPath &&
                    Array.isArray(course.slides) &&
                    course.slides.length > 0
                );

                setCourses(loadedCourses);
                setActiveCourseId(loadedCourses[0]?.id || '');
                setActiveSlideIndex(0);
                setError('');
            })
            .catch(() => {
                if (!isMounted) return;
                setCourses([]);
                setActiveCourseId('');
                setError('Nenhum material de curso foi encontrado.');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const activeCourse = useMemo(
        () => courses.find(course => course.id === activeCourseId) || courses[0],
        [activeCourseId, courses]
    );

    const slideCount = activeCourse?.slides.length || 0;
    const activeSlide = activeCourse?.slides[activeSlideIndex] || '';
    const activeSlideUrl = activeCourse && activeSlide
        ? `/course-slides/${activeCourse.slidesPath}/${activeSlide}`
        : '';

    const goToSlide = (nextIndex: number) => {
        if (!slideCount) return;
        const boundedIndex = Math.max(0, Math.min(slideCount - 1, nextIndex));
        setActiveSlideIndex(boundedIndex);
    };

    const blockCopyAction = (event: React.SyntheticEvent) => {
        event.preventDefault();
    };

    return (
        <div
            className="animate-fadeIn pb-24 select-none"
            onCopy={blockCopyAction}
            onCut={blockCopyAction}
            onContextMenu={blockCopyAction}
            onDragStart={blockCopyAction}
        >
            <SectionTitle icon="fa-solid fa-chalkboard-user" title="7. Curso / Slides" />

            <Card className="mb-4 border-t-4 border-t-[#00d9ff]/70">
                <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#2a3646] border border-[#00d9ff]/35 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-book-open-reader text-[#00d9ff]" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#00d9ff] font-heading">Biblioteca do curso</p>
                        <h3 className="mt-1 text-base font-black text-white font-heading">Treinamentos e slides</h3>
                        <p className="mt-1 text-[11px] leading-relaxed text-white/65">
                            Material de apoio para consulta direta no app, em paginas estaticas e sem saida externa.
                        </p>
                    </div>
                </div>
            </Card>

            {loading && (
                <div className="mt-6 p-4 rounded-xl text-center border animate-pulse bg-[#111827] border-[#122837]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 font-heading">Carregando curso...</p>
                </div>
            )}

            {!loading && !activeCourse && (
                <Card>
                    <div className="py-8 text-center">
                        <i className="fa-solid fa-folder-open text-3xl text-white/25 mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest text-white font-heading">Sem slides cadastrados</p>
                        <p className="mt-2 text-[11px] leading-relaxed text-white/60">
                            Coloque os arquivos em public/course-slides e atualize slides.json.
                        </p>
                        {error && <p className="mt-3 text-[10px] text-[#ffb86b]">{error}</p>}
                    </div>
                </Card>
            )}

            {!loading && activeCourse && (
                <>
                    {courses.length > 1 && (
                        <div className="grid grid-cols-1 gap-2 mb-4">
                            {courses.map(course => (
                                <button
                                    key={course.id}
                                    onClick={() => {
                                        setActiveCourseId(course.id);
                                        setActiveSlideIndex(0);
                                    }}
                                    className={`rounded-2xl border p-3 text-left transition-all active:scale-[0.99] ${
                                        course.id === activeCourse.id
                                            ? 'bg-[#ff6600] border-[#ff8833] text-white'
                                            : 'bg-[#3b4c61]/80 border-[#4a5c73] text-white/70'
                                    }`}
                                >
                                    <span className="block text-xs font-black font-heading">{course.title}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <Card className="overflow-hidden">
                        <div className="mb-3">
                            <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#00d9ff] font-heading">
                                    Slide {activeSlideIndex + 1} de {slideCount}
                                </p>
                                <h3 className="mt-1 text-sm font-black leading-tight text-white font-heading">{activeCourse.title}</h3>
                                {activeCourse.description && (
                                    <p className="mt-1 text-[11px] leading-relaxed text-white/60">{activeCourse.description}</p>
                                )}
                            </div>
                        </div>

                        <div className="relative rounded-2xl overflow-hidden border border-[#4a5c73] bg-[#111827]">
                            <img
                                src={activeSlideUrl}
                                alt={`${activeCourse.title} - slide ${activeSlideIndex + 1}`}
                                className="block w-full h-auto pointer-events-none select-none"
                                draggable={false}
                                onContextMenu={blockCopyAction}
                            />
                            <div className="absolute inset-0 pointer-events-auto" onContextMenu={blockCopyAction} />
                            <div className="absolute inset-0 pointer-events-none opacity-[0.08] flex items-center justify-center -rotate-12">
                                <span className="text-white text-2xl font-black tracking-[0.22em] whitespace-nowrap font-heading">
                                    ORDEMILK TREINAMENTO
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => goToSlide(activeSlideIndex - 1)}
                                disabled={activeSlideIndex === 0}
                                className="!py-3"
                            >
                                <i className="fa-solid fa-chevron-left" /> Anterior
                            </Button>

                            <span className="text-[10px] font-black text-white/55 font-heading whitespace-nowrap">
                                {activeSlideIndex + 1}/{slideCount}
                            </span>

                            <Button
                                variant="secondary"
                                onClick={() => goToSlide(activeSlideIndex + 1)}
                                disabled={activeSlideIndex >= slideCount - 1}
                                className="!py-3"
                            >
                                Proximo <i className="fa-solid fa-chevron-right" />
                            </Button>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};
