// types.ts

// FIXED: Changed 'any' to 'unknown' to satisfy the linter
export interface ApiResponse<T = unknown> {
    data: PaginatedData<T>;
    status: string;
    message?: string;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}