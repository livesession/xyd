import React from 'react'

export interface ITheme<T> {
    children: React.ReactNode

    themeSettings?: T
}