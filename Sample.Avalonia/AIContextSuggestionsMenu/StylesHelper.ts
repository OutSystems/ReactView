/**
 * Helper function that takes an object where property names are CSS class names
 * and the values are booleans on whether those classes should be included or not.
 * The function builds a class string that only contains the enabled classes.
 */
export function classNames(classes: { [name: string]: boolean }): string {
    return Object.entries(classes)
        .filter((i) => i[1])
        .map((i) => i[0])
        .join(" ");
}

/* Helper function to return value number with PX unit */
export function valueToPX(value: number): string {
    return value + "px";
}

export function pxToValue(value: string): number {
    return parseInt(value, 10);
}