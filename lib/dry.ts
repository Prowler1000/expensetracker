export type NoUndefined<T> = T extends undefined ? never : T;

export function IsDefined<TValue>(value: TValue | undefined): value is TValue {
    return typeof value !== undefined && value !== null
}

export function StripUndefined<TValue>(value: TValue | undefined): TValue {
    return value as TValue;
}