"use client";

import { Layout } from "@/components/Layout";
import { documents as mockDocuments } from "@/lib/mockData";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  MoreVertical,
  FolderOpen,
  Calendar,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useEffect, useMemo, useRef, useState } from "react";
import { useEmployee } from "@/context/EmployeeProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchEmployeeProfile,
  selectEmployeeProfile,
  selectProfileStatus,
  selectProfileError,
} from "@/features/profile/profileSlice";

type EmployeeDocument = {
  id?: string | number;
  name?: string;
  original_file_name?: string;
  size?: string | number;
  file_size?: string | number;
  date?: string;
  created_at?: string;
  category?: string;
  file_type?: string;
  url?: string;
  download_url?: string;
  file_path?: string;
  path?: string;
  [key: string]: any;
};

type DateFilter = "all" | "30" | "90" | "365";
type SortBy = "newest" | "oldest" | "name" | "size";

export default function Documents() {
  const { user } = useEmployee();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectEmployeeProfile);
  const status = useAppSelector(selectProfileStatus);
  const error = useAppSelector(selectProfileError);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user?.user_id) {
      dispatch(
        fetchEmployeeProfile({
          portal_user: user.user_id,
          portal_id: "employee",
        }),
      );
    }
  }, [dispatch, user]);

  const docs: EmployeeDocument[] =
    (profile?.documents as any[]) ||
    (profile?.employee_documents as any[]) ||
    (mockDocuments as any[]);

  // Derive categories & types dynamically
  const { categories, fileTypes } = useMemo(() => {
    const cats = new Map<string, number>();
    const types = new Set<string>();

    docs.forEach((d) => {
      const category = (d.category || d.file_type || "Uncategorised") as string;
      cats.set(category, (cats.get(category) || 0) + 1);

      const type =
        d.file_type ||
        (d.original_file_name || d.name || "")
          .toString()
          .split(".")
          .pop() ||
        "";
      if (type) types.add(type.toString());
    });

    return {
      categories: Array.from(cats.entries()).map(([name, count]) => ({
        name,
        count,
      })),
      fileTypes: Array.from(types),
    };
  }, [docs]);

  const filteredAndSorted = useMemo(() => {
    const now = new Date();

    const matchDateFilter = (doc: EmployeeDocument) => {
      if (dateFilter === "all") return true;
      const rawDate = doc.date || doc.created_at;
      if (!rawDate) return false;
      const d = new Date(rawDate);
      if (Number.isNaN(d.getTime())) return false;

      const diffMs = now.getTime() - d.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (dateFilter === "30") return diffDays <= 30;
      if (dateFilter === "90") return diffDays <= 90;
      if (dateFilter === "365") return diffDays <= 365;
      return true;
    };

    const matchCategory = (doc: EmployeeDocument) => {
      if (categoryFilter === "All") return true;
      const category =
        (doc.category || doc.file_type || "Uncategorised")?.toString() || "";
      return category === categoryFilter;
    };

    const matchType = (doc: EmployeeDocument) => {
      if (typeFilter === "All") return true;
      const t =
        doc.file_type ||
        (doc.original_file_name || doc.name || "")
          .toString()
          .split(".")
          .pop() ||
        "";
      return t === typeFilter;
    };

    const matchSearch = (doc: EmployeeDocument) => {
      if (!search) return true;
      const term = search.toLowerCase();
      const name = (
        doc.name ||
        doc.original_file_name ||
        ""
      )
        .toString()
        .toLowerCase();
      const category =
        (doc.category || doc.file_type || "")
          .toString()
          .toLowerCase() || "";
      return (
        name.includes(term) ||
        category.includes(term) ||
        (doc.id && doc.id.toString().toLowerCase().includes(term))
      );
    };

    const getDate = (doc: EmployeeDocument) => {
      const raw = doc.date || doc.created_at;
      const d = raw ? new Date(raw) : null;
      return d && !Number.isNaN(d.getTime()) ? d : null;
    };

    const getSizeNumber = (doc: EmployeeDocument) => {
      const s = doc.size ?? doc.file_size;
      if (typeof s === "number") return s;
      if (typeof s === "string") {
        const numeric = parseFloat(s);
        return Number.isFinite(numeric) ? numeric : 0;
      }
      return 0;
    };

    const filtered = docs.filter(
      (d) =>
        matchSearch(d) && matchCategory(d) && matchType(d) && matchDateFilter(d),
    );

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        const an =
          (a.name || a.original_file_name || "").toString().toLowerCase();
        const bn =
          (b.name || b.original_file_name || "").toString().toLowerCase();
        return an.localeCompare(bn);
      }

      if (sortBy === "size") {
        return getSizeNumber(b) - getSizeNumber(a);
      }

      const dateA = getDate(a);
      const dateB = getDate(b);

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      if (sortBy === "newest") {
        return dateB.getTime() - dateA.getTime();
      } else {
        // oldest
        return dateA.getTime() - dateB.getTime();
      }
    });

    return sorted;
  }, [docs, search, categoryFilter, typeFilter, dateFilter, sortBy]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Here you would call your upload API.
      // For now we just log it so devs can see it's wired correctly.
      console.log("Selected file for upload:", file);
    }
  };

  const getDocTitle = (doc: EmployeeDocument) =>
    (doc.name || doc.original_file_name || "Document") as string;

  const getDocDate = (doc: EmployeeDocument) => {
    const raw = doc.date || doc.created_at;
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString();
  };

  const getDocCategory = (doc: EmployeeDocument) =>
    (doc.category || doc.file_type || "File") as string;

  const getDocSize = (doc: EmployeeDocument) =>
    (doc.size || doc.file_size || "") as string | number;

  const getDownloadHref = (doc: EmployeeDocument) =>
    (doc.url ||
      doc.download_url ||
      doc.file_path ||
      doc.path ||
      "") as string;

  const totalDocs = docs.length;
  const totalFiltered = filteredAndSorted.length;

  const showEmptyState =
    status !== "loading" && (!docs || docs.length === 0);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
              Documents
              {totalDocs > 0 && (
                <Badge variant="outline" className="text-[11px]">
                  {totalDocs} files
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              Access contracts, payslips, and company policies. Filter, sort,
              and download your documents.
            </p>
            {status === "loading" && (
              <p className="text-xs text-muted-foreground mt-1">
                Syncing with server…
              </p>
            )}
            {error && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              className="gap-2"
              onClick={handleUploadClick}
              variant="default"
            >
              <Upload className="h-4 w-4" /> Upload Document
            </Button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center bg-card p-4 rounded-xl shadow-sm border">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, id, category..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto ml-auto">
            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 lg:flex-none">
                  {sortBy === "name" ? (
                    <SortAsc className="mr-2 h-4 w-4" />
                  ) : sortBy === "size" ? (
                    <SortDesc className="mr-2 h-4 w-4" />
                  ) : (
                    <Calendar className="mr-2 h-4 w-4" />
                  )}
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSortBy("newest")}>
                  Newest first
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  Oldest first
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  Name A–Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("size")}>
                  Size (largest)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Date filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 lg:flex-none">
                  <Filter className="mr-2 h-4 w-4" />
                  Date
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Date range</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setDateFilter("all")}>
                  All time
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter("30")}>
                  Last 30 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter("90")}>
                  Last 90 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter("365")}>
                  Last 12 months
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Type filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 lg:flex-none">
                  Type
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>File type</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTypeFilter("All")}>
                  All types
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {fileTypes.map((t) => (
                  <DropdownMenuItem
                    key={t}
                    onClick={() => setTypeFilter(t)}
                  >
                    {t.toUpperCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear filters */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 lg:flex-none"
              onClick={() => {
                setCategoryFilter("All");
                setTypeFilter("All");
                setDateFilter("all");
                setSortBy("newest");
                setSearch("");
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "All", count: totalDocs },
              ...categories,
            ].map((cat, i) => (
              <motion.div
                key={`${cat.name}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  onClick={() => setCategoryFilter(cat.name)}
                  className={`cursor-pointer border-dashed hover:shadow-sm transition-all ${
                    categoryFilter === cat.name
                      ? "bg-primary/5 border-primary/50"
                      : "hover:bg-accent/40"
                  }`}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center gap-2">
                    <div className="relative">
                      <FolderOpen className="h-8 w-8 text-primary/70" />
                      <span className="absolute -top-1 -right-3 bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5">
                        {cat.count}
                      </span>
                    </div>
                    <span className="font-medium text-sm truncate max-w-[120px]">
                      {cat.name}
                    </span>
                    {categoryFilter === cat.name && (
                      <span className="text-[10px] text-primary mt-1">
                        Active filter
                      </span>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Document List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All Documents</CardTitle>
              <CardDescription className="text-xs">
                {showEmptyState
                  ? "No documents found yet."
                  : status === "loading"
                  ? "Loading documents..."
                  : error
                  ? error
                  : totalFiltered === totalDocs
                  ? `Showing ${totalFiltered} documents`
                  : `Showing ${totalFiltered} of ${totalDocs} documents`}
              </CardDescription>
            </div>
            {totalFiltered > 0 && (
              <span className="text-[11px] text-muted-foreground">
                Filters applied:{" "}
                {categoryFilter !== "All" ||
                typeFilter !== "All" ||
                dateFilter !== "all"
                  ? "Yes"
                  : "No"}
              </span>
            )}
          </CardHeader>
          <CardContent>
            {status === "loading" && (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse flex items-center justify-between p-4 rounded-lg border bg-muted/40"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted" />
                      <div className="space-y-2">
                        <div className="h-3 w-40 bg-muted rounded" />
                        <div className="h-2 w-32 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                ))}
              </div>
            )}

            {!status?.startsWith("loading") && totalFiltered === 0 && !showEmptyState && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <p className="mb-2">No documents match your current filters.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter("All");
                    setTypeFilter("All");
                    setDateFilter("all");
                    setSearch("");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}

            {!status?.startsWith("loading") && showEmptyState && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <p>No documents found for your profile yet.</p>
              </div>
            )}

            <div className="space-y-2">
              {filteredAndSorted.map((doc, i) => {
                const href = getDownloadHref(doc);
                const title = getDocTitle(doc);
                const dateLabel = getDocDate(doc);
                const categoryLabel = getDocCategory(doc);
                const sizeLabel = getDocSize(doc);

                const ext =
                  doc.file_type ||
                  (doc.original_file_name || doc.name || "")
                    .toString()
                    .split(".")
                    .pop() ||
                  "";
                const extLabel = ext ? ext.toUpperCase() : "";

                return (
                  <motion.div
                    key={doc.id || doc.original_file_name || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate max-w-[260px]">
                          {title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {sizeLabel && (
                            <>
                              <span>{sizeLabel}</span>
                              <span>•</span>
                            </>
                          )}
                          {dateLabel && (
                            <>
                              <span>{dateLabel}</span>
                              <span>•</span>
                            </>
                          )}
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {categoryLabel}
                          </Badge>
                          {extLabel && (
                            <Badge
                              variant="outline"
                              className="text-[9px] h-4 px-1"
                            >
                              {extLabel}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground opacity-50 cursor-not-allowed"
                          disabled
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              if (href) window.open(href, "_blank");
                            }}
                          >
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              console.log("Rename clicked for:", doc)
                            }
                          >
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() =>
                              console.log("Delete clicked for:", doc)
                            }
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
