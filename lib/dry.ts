export type NoUndefined<T> = T extends undefined ? never : T;

export function StripUndefined<TValue>(value: TValue | undefined): TValue {
    return value as TValue;
}