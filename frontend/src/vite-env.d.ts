/// <reference types="vite/client" />


// Déclarations pour les CSS Modules (au cas où)
declare module '*.module.css' {
    const classes: { readonly [key: string]: string };
    export default classes;
}


// Déclarations pour les assets
declare module '*.svg' {
    const content: string;
    export default content;
}




declare module '*.png' {
    const content: string;
    export default content;
}