export declare class PaginationDto {
    page?: number;
    limit?: number;
}
export declare class PaginatedResultDto<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
