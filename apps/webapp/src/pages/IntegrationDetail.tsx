import {
  ArrowLeft,
  ExternalLink,
  Heart,
  Star,
  Download,
  ShieldCheck,
  Check,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Tag,
  Clock3,
  GitBranch,
  ScrollText,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { pluginManager } from "../services/pluginManager";
import type { UnifiedPlugin } from "../services/pluginSources";
import ReactDOMServer from "react-dom/server";
import React from "react";

const tabs = [
  { id: "description", label: "Description" },
  { id: "permissions", label: "Permissions" },
];

export function IntegrationDetail() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [integration, setIntegration] = useState<UnifiedPlugin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [readmeHtml, setReadmeHtml] = useState<string>("");
  const [isLoadingReadme, setIsLoadingReadme] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("description");
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [connectedRepos, setConnectedRepos] = useState<GitHubRepository[]>([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState<Set<number>>(
    new Set()
  );
  const [showInstallMenu, setShowInstallMenu] = useState<boolean>(false);

  const slides = useMemo(() => integration?.heroSlides || [], [integration]);

  useEffect(() => {
    const loadPlugin = async () => {
      if (!slug) return;

      setIsLoading(true);
      setReadmeHtml(""); // Clear previous README content
      try {
        const plugin = await pluginManager.getPlugin(slug);
        setIntegration(plugin);

        // If it's an OpenVSX plugin, fetch and compile README via IPC
        if (plugin?.source === "openvsx" && plugin.namespace) {
          setIsLoadingReadme(true);
          try {
            const result =
              await window.electronAPI.openvsx.fetchAndCompileReadme(
                plugin.namespace,
                plugin.name,
                plugin.version
              );

            if (result.success && result.compiledContent) {
              // Execute the compiled MDX code to get React component
              const mdxResult = mdxExport(result.compiledContent);

              if (mdxResult && mdxResult.default) {
                const MDXComponent = mdxResult.default;
                const reactTree = MDXComponent({});
                const htmlString =
                  ReactDOMServer.renderToStaticMarkup(reactTree);
                setReadmeHtml(htmlString);
              }
            }
          } catch (error) {
            console.error("Failed to load README:", error);
          } finally {
            setIsLoadingReadme(false);
          }
        }
      } catch (error) {
        console.error("Failed to load plugin:", error);
        setIntegration(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlugin();
  }, [slug]);

  // Helper function to execute compiled MDX code
  const mdxExport = (code: string) => {
    const scope = {
      Fragment: React.Fragment,
      jsxs: React.createElement,
      jsx: React.createElement,
      jsxDEV: React.createElement,
    };
    const fn = new Function(...Object.keys(scope), code);
    return fn(scope);
  };

  useEffect(() => {
    const loadConnectedRepos = async () => {
      try {
        const result = await window.electronAPI.repositories.getConnected();
        if (result.success && result.repositories) {
          setConnectedRepos(result.repositories);
        }
      } catch (error) {
        console.error("Failed to load connected repositories:", error);
      }
    };

    loadConnectedRepos();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <p className="text-gray-700 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!integration) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <p className="text-gray-700 font-semibold">Integration not found</p>
        </div>
        <p className="text-gray-500">
          The integration you are looking for does not exist or was removed.
        </p>
      </div>
    );
  }

  const nextSlide = () => {
    if (!slides.length) return;
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (!slides.length) return;
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const toggleRepoSelection = (id: number) => {
    setSelectedRepoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedCount = selectedRepoIds.size;
  const installLabel =
    selectedCount === 0
      ? "Install to projects"
      : `Install to ${selectedCount} project${selectedCount > 1 ? "s" : ""}`;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/integrations" className="hover:text-gray-900">
          Apps
        </Link>
        <span>›</span>
        <span className="text-gray-700 font-medium capitalize">
          {integration.category}
        </span>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {integration.iconUrl ? (
              <img
                src={integration.iconUrl}
                alt={`${integration.name} icon`}
                className="w-12 h-12 rounded-xl object-cover shadow-sm"
              />
            ) : (
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${integration.accent} ${integration.text} flex items-center justify-center font-semibold text-base shadow-inner`}
              >
                {integration.initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {integration.name}
                </h1>
                {integration.source === "openvsx" && (
                  <span className="px-2 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-xs font-medium text-indigo-700">
                    OpenVSX
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {integration.publisher}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
              <Heart className="w-4 h-4" />
              <span>{integration.reviews}</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowInstallMenu((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1f1f1f] text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-black transition"
              >
                {installLabel}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showInstallMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowInstallMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-gray-900">
                        Install to projects
                      </p>
                      <span className="text-xs text-gray-500">
                        {selectedCount}/{connectedRepos.length}
                      </span>
                    </div>
                    {connectedRepos.length === 0 ? (
                      <div className="text-sm text-gray-600 p-3 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
                        No projects connected yet. Connect a repo to install
                        this integration.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {connectedRepos.map((repo) => {
                          const selected = selectedRepoIds.has(repo.id);
                          return (
                            <button
                              key={repo.id}
                              onClick={() => toggleRepoSelection(repo.id)}
                              className={`w-full flex items-start gap-3 text-left px-3 py-2 rounded-lg border transition ${
                                selected
                                  ? "border-indigo-200 bg-indigo-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">
                                  {repo.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {repo.full_name}
                                </p>
                              </div>
                              {selected ? (
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-gray-300 mt-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-gray-500">
                        Choose one or more projects to install this integration.
                      </p>
                      <button
                        onClick={() => setShowInstallMenu(false)}
                        className="cursor-pointer text-xs font-semibold text-indigo-700 hover:underline"
                      >
                        Install
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            {integration.iconUrl ? (
              <img
                src={integration.iconUrl}
                alt={`${integration.name} icon`}
                className="w-10 h-10 rounded-lg object-cover shadow-sm"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${integration.accent} ${integration.text} flex items-center justify-center font-semibold text-sm shadow-inner`}
              >
                {integration.initials}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">
                Get insights directly in your workspace
              </p>
              <p className="font-semibold text-gray-900">{integration.name}</p>
            </div>
          </div>

          {slides?.length ? (
            <div className="lg:col-span-2 bg-white rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevSlide}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {slides.map((slide, index) => (
                  <div
                    key={slide}
                    className={`rounded-xl border relative overflow-hidden transition ${
                      index === activeSlide
                        ? "border-indigo-200 shadow-md"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4 text-center text-gray-700 font-semibold">
                      {slide}
                    </div>
                    {index === activeSlide && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[11px] bg-white border border-indigo-100 text-indigo-700 font-medium">
                        View
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-b border-gray-200 flex gap-6 text-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 font-semibold ${
                  activeTab === tab.id
                    ? "text-gray-900 border-b-2 border-gray-900"
                    : "text-gray-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "description" && (
            <div className="space-y-5">
              {/* Show README for OpenVSX plugins, or fallback to description */}
              {integration.source === "openvsx" ? (
                isLoadingReadme ? (
                  <p className="text-gray-500 italic">Loading README...</p>
                ) : (
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: readmeHtml }}
                  />
                )
              ) : integration.longDescription &&
                integration.longDescription.length > 0 ? (
                integration.longDescription.map((paragraph) => (
                  <p key={paragraph} className="text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  {integration.description}
                </p>
              )}
              {integration.keyPoints && integration.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">What you get</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {integration.keyPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              {integration.features && integration.features.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  {integration.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <Check className="w-4 h-4 text-emerald-500 mt-1" />
                      <p className="text-sm text-gray-800">{feature}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "permissions" && (
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Permissions needed to operate this integration inside your
                workspace.
              </p>
              {integration.permissions && integration.permissions.length > 0 ? (
                <div className="space-y-3">
                  {integration.permissions.map((permission) => (
                    <div
                      key={permission}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <ShieldCheck className="w-4 h-4 text-blue-600 mt-1" />
                      <p className="text-sm text-gray-800">{permission}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No specific permissions required for this integration.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {integration.keyPoints && integration.keyPoints.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">Highlights</p>
                <span className="text-xs text-gray-500">Verified</span>
              </div>
              <div className="space-y-2">
                {integration.keyPoints.slice(0, 3).map((highlight) => (
                  <div key={highlight} className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-blue-600 mt-1" />
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {highlight}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <p className="font-semibold text-gray-900">
                {integration.rating.toFixed(1)}{" "}
                <span className="text-sm text-gray-500">
                  ({integration.reviews} ratings)
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Download className="w-4 h-4" />
              <span>{integration.installs} installs</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock3 className="w-4 h-4" />
              <span>Updated {integration.lastUpdated}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <GitBranch className="w-4 h-4" />
              <span>Version {integration.version}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ScrollText className="w-4 h-4" />
              <span>License: {integration.license}</span>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={integration.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                View website
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <p className="font-semibold text-gray-900">Tags</p>
            <div className="flex flex-wrap gap-2">
              {integration.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs text-gray-700"
                >
                  <Tag className="w-3 h-3 text-gray-400" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <p className="font-semibold text-gray-900">Support</p>
            <Link
              to="/support"
              className="text-sm text-indigo-700 hover:underline"
            >
              Support site
            </Link>
            <p className="text-xs text-gray-500">
              Need something else? Open a ticket and we will respond within one
              business day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
