export interface ITheme<T> {
    children: JSX.Element | JSX.Element[]

    themeSettings?: T
}