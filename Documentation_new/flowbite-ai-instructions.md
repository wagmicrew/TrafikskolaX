# TrafikskolaX Flowbite Implementation Guide

## 📋 **AI Instructions for Flowbite Component Usage**

This document provides comprehensive instructions for implementing Flowbite components in the TrafikskolaX application, ensuring consistent design, optimal mobile responsiveness, and professional user experience.

## 🎯 **Core Principles**

### **1. Mobile-First Approach**
- **Primary Target**: Mobile devices (320px and up)
- **Responsive Scaling**: Components adapt gracefully to larger screens
- **Touch Optimization**: All interactive elements sized for touch (44px minimum)
- **Performance**: Lightweight implementation with lazy loading

### **2. Design System Consistency**
- **Color Palette**: Use Flowbite's default color system
- **Typography**: Consistent text hierarchy and spacing
- **Spacing**: Use Flowbite's spacing scale (4px base unit)
- **Shadows**: Apply appropriate shadow levels for depth

### **3. Swedish Localization**
- **Text Content**: Maintain Swedish language throughout
- **Cultural Adaptation**: Respect Swedish design conventions
- **Accessibility**: WCAG 2.1 AA compliance for Swedish users

## 🔧 **Component Implementation Guidelines**

### **Typography Components**

#### **Headings (Flowbite Headings)**
```html
<!-- Page Title -->
<h1 class="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
    Trafikskola Hässleholm
</h1>

<!-- Section Headings -->
<h2 class="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
    Våra Tjänster
</h2>

<!-- Subsection Headings -->
<h3 class="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
    Körlektioner
</h3>

<!-- Card Titles -->
<h4 class="mb-2 text-xl font-bold text-gray-900 dark:text-white">
    Boka Tid
</h4>

<!-- Small Headings -->
<h5 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
    Kontakta Oss
</h5>
```

#### **Paragraphs & Text**
```html
<!-- Lead Paragraph -->
<p class="mb-6 text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">
    Profesionell trafikskola med moderna metoder och erfarna instruktörer.
</p>

<!-- Regular Paragraph -->
<p class="mb-3 font-normal text-gray-700 dark:text-gray-400">
    Vi erbjuder körlektioner, teorikurser och handledarutbildning.
</p>

<!-- Small Text -->
<small class="text-sm font-medium text-gray-900 dark:text-white">
    Öppettider: Mån-Fre 08:00-18:00
</small>

<!-- Muted Text -->
<p class="text-sm text-gray-500 dark:text-gray-400">
    * Priser exklusive moms
</p>
```

#### **Blockquotes**
```html
<blockquote class="p-4 my-4 bg-gray-50 border-l-4 border-gray-300 dark:bg-gray-800 dark:border-gray-500">
    <p class="text-xl italic font-medium leading-relaxed text-gray-900 dark:text-white">
        "En fantastisk trafikskola med professionella instruktörer!"
    </p>
    <cite class="text-sm text-gray-500 dark:text-gray-400">— Anna Andersson, Elev</cite>
</blockquote>
```

#### **Lists**
```html
<!-- Unordered List -->
<ul class="max-w-md space-y-1 text-gray-500 list-disc list-inside dark:text-gray-400">
    <li>Körlektioner med moderna bilar</li>
    <li>Teoretisk utbildning online</li>
    <li>Handledarutbildning</li>
</ul>

<!-- Ordered List -->
<ol class="max-w-md space-y-1 text-gray-500 list-decimal list-inside dark:text-gray-400">
    <li>Boka tid online</li>
    <li>Genomför teoriprov</li>
    <li>Praktiska körprov</li>
</ol>

<!-- Description List -->
<dl class="max-w-md text-gray-900 divide-y divide-gray-200 dark:text-white dark:divide-gray-700">
    <div class="flex flex-col pb-3">
        <dt class="mb-1 text-gray-500 md:text-lg dark:text-gray-400">Körlektioner</dt>
        <dd class="text-lg font-semibold">950 kr/tim</dd>
    </div>
    <div class="flex flex-col py-3">
        <dt class="mb-1 text-gray-500 md:text-lg dark:text-gray-400">Teorikurs</dt>
        <dd class="text-lg font-semibold">2 500 kr</dd>
    </div>
</dl>
```

#### **Links**
```html
<!-- Primary Link -->
<a href="/boka" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">
    Boka tid nu
</a>

<!-- Button Link -->
<a href="/kontakt" class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
    Kontakta oss
    <svg class="w-3.5 h-3.5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
    </svg>
</a>
```

#### **Horizontal Rules**
```html
<hr class="my-8 h-px bg-gray-200 border-0 dark:bg-gray-700">
```

### **Layout Components**

#### **Jumbotron/Hero Section**
```html
<section class="bg-white dark:bg-gray-900">
    <div class="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
        <div class="mr-auto place-self-center lg:col-span-7">
            <h1 class="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">
                Trafikskola Hässleholm
            </h1>
            <p class="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">
                Säker och professionell trafikskola med moderna undervisningsmetoder.
            </p>
            <a href="/boka" class="inline-flex items-center justify-center px-5 py-3 mr-3 text-base font-medium text-center text-white rounded-lg bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900">
                Boka tid
                <svg class="w-5 h-5 ml-2 -mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            </a>
        </div>
        <div class="hidden lg:mt-0 lg:col-span-5 lg:flex">
            <img src="/images/trafikskola-hero.jpg" alt="Trafikskola Hässleholm" class="rounded-lg">
        </div>
    </div>
</section>
```

#### **Cards**
```html
<!-- Basic Card -->
<div class="max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
    <a href="#">
        <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Körlektioner</h5>
    </a>
    <p class="mb-3 font-normal text-gray-700 dark:text-gray-400">
        Lär dig köra bil på ett säkert och professionellt sätt.
    </p>
    <a href="/boka" class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
        Boka tid
        <svg class="w-3.5 h-3.5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
        </svg>
    </a>
</div>

<!-- Card with Image -->
<div class="max-w-sm bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
    <a href="#">
        <img class="rounded-t-lg" src="/images/korlektion.jpg" alt="Körlektion" />
    </a>
    <div class="p-5">
        <a href="#">
            <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Körlektioner</h5>
        </a>
        <p class="mb-3 font-normal text-gray-700 dark:text-gray-400">
            Moderna bilar och erfarna instruktörer hjälper dig bli en säker förare.
        </p>
        <a href="/boka" class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
            Läs mer
            <svg class="w-3.5 h-3.5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
        </a>
    </div>
</div>
```

#### **Alerts**
```html
<!-- Success Alert -->
<div class="flex items-center p-4 mb-4 text-sm text-green-800 border border-green-300 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-800" role="alert">
    <svg class="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.5 9.5 0 0 0 10 .5ZM8.707 7.293a1 1 0 0 0-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 1 0 1.414 1.414l2-2a1 1 0 0 0 0-1.414l-2-2ZM11 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
    </svg>
    <span class="sr-only">Info</span>
    <div>
        <span class="font-medium">Bokning bekräftad!</span> Du kommer att få en bekräftelse via e-post inom kort.
    </div>
</div>

<!-- Warning Alert -->
<div class="flex items-center p-4 mb-4 text-sm text-yellow-800 border border-yellow-300 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 dark:border-yellow-800" role="alert">
    <svg class="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.5 9.5 0 0 0 10 .5ZM8.5 4a1.5 1.5 0 1 1 3 0v5.5a1.5 1.5 0 0 1-3 0V4ZM10 15.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/>
    </svg>
    <span class="sr-only">Warning</span>
    <div>
        <span class="font-medium">Observera!</span> Vissa sessioner är redan fullbokade.
    </div>
</div>

<!-- Error Alert -->
<div class="flex items-center p-4 mb-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
    <svg class="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.5 9.5 0 0 0 10 .5ZM8.707 7.293a1 1 0 0 0-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 1 0 1.414 1.414l2-2a1 1 0 0 0 0-1.414l-2-2ZM11 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
    </svg>
    <span class="sr-only">Error</span>
    <div>
        <span class="font-medium">Fel!</span> Kunde inte genomföra bokningen. Försök igen senare.
    </div>
</div>
```

### **Navigation Components**

#### **Bottom Navigation (Mobile)**
```html
<!-- Bottom Navigation -->
<div class="fixed z-50 w-full h-16 max-w-lg -translate-x-1/2 bg-white border-t border-gray-200 left-1/2 bottom-0 dark:bg-gray-700 dark:border-gray-600">
    <div class="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
        <a href="/" class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
            <svg class="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-6 6a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-6-6z"></path>
            </svg>
            <span class="text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">Hem</span>
        </a>
        <a href="/boka" class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
            <svg class="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">Boka</span>
        </a>
        <a href="/om-oss" class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
            <svg class="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">Om oss</span>
        </a>
        <a href="/kontakt" class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
            <svg class="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
            </svg>
            <span class="text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">Kontakt</span>
        </a>
    </div>
</div>
```

#### **Navbar**
```html
<nav class="bg-white border-gray-200 px-2 sm:px-4 py-2.5 rounded dark:bg-gray-900">
    <div class="container flex flex-wrap items-center justify-between mx-auto">
        <a href="/" class="flex items-center">
            <img src="/images/logo.png" class="h-6 mr-3 sm:h-9" alt="Trafikskola Hässleholm" />
            <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">Trafikskola</span>
        </a>
        <button data-collapse-toggle="navbar-default" type="button" class="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-default" aria-expanded="false">
            <span class="sr-only">Öppna huvudmeny</span>
            <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
            </svg>
        </button>
        <div class="hidden w-full md:block md:w-auto" id="navbar-default">
            <ul class="flex flex-col p-4 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
                <li>
                    <a href="/" class="block py-2 pl-3 pr-4 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 dark:text-white" aria-current="page">Hem</a>
                </li>
                <li>
                    <a href="/boka" class="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Boka tid</a>
                </li>
                <li>
                    <a href="/om-oss" class="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Om oss</a>
                </li>
                <li>
                    <a href="/kontakt" class="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Kontakt</a>
                </li>
            </ul>
        </div>
    </div>
</nav>
```

### **Interactive Components**

#### **Buttons**
```html
<!-- Primary Button -->
<button type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
    Boka tid
    <svg class="w-3.5 h-3.5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
    </svg>
</button>

<!-- Secondary Button -->
<button type="button" class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">
    Läs mer
</button>

<!-- Success Button -->
<button type="button" class="text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-300">
    Bekräfta
</button>

<!-- Danger Button -->
<button type="button" class="text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-300">
    Avboka
</button>
```

#### **Button Groups**
```html
<div class="flex flex-wrap gap-2">
    <button type="button" class="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white">
        Föregående
    </button>
    <button type="button" class="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white">
        Nästa
    </button>
    <button type="button" class="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-r-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white">
        Sista
    </button>
</div>
```

#### **Modals**
```html
<!-- Button trigger modal -->
<button data-modal-target="default-modal" data-modal-toggle="default-modal" class="block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button">
    Öppna modal
</button>

<!-- Modal -->
<div id="default-modal" tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
    <div class="relative w-full max-w-2xl max-h-full">
        <!-- Modal content -->
        <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
            <!-- Modal header -->
            <div class="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                    Bokningsbekräftelse
                </h3>
                <button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="default-modal">
                    <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6-6"/>
                    </svg>
                    <span class="sr-only">Stäng modal</span>
                </button>
            </div>
            <!-- Modal body -->
            <div class="p-6 space-y-6">
                <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                    Din bokning har bekräftats. Du kommer att få en bekräftelse via e-post inom kort.
                </p>
            </div>
            <!-- Modal footer -->
            <div class="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
                <button data-modal-hide="default-modal" type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-300">
                    Jag förstår
                </button>
                <button data-modal-hide="default-modal" type="button" class="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600">
                    Avbryt
                </button>
            </div>
        </div>
    </div>
</div>
```

#### **Tabs**
```html
<div class="mb-4 border-b border-gray-200 dark:border-gray-700">
    <ul class="flex flex-wrap -mb-px text-sm font-medium text-center" id="myTab" data-tabs-toggle="#myTabContent" role="tablist">
        <li class="mr-2" role="presentation">
            <button class="inline-block p-4 border-b-2 rounded-t-lg" id="profile-tab" data-tabs-target="#profile" type="button" role="tab" aria-controls="profile" aria-selected="false">
                Körlektioner
            </button>
        </li>
        <li class="mr-2" role="presentation">
            <button class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300" id="dashboard-tab" data-tabs-target="#dashboard" type="button" role="tab" aria-controls="dashboard" aria-selected="false">
                Teorikurser
            </button>
        </li>
        <li class="mr-2" role="presentation">
            <button class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300" id="settings-tab" data-tabs-target="#settings" type="button" role="tab" aria-controls="settings" aria-selected="false">
                Handledarutbildning
            </button>
        </li>
    </ul>
</div>
<div id="myTabContent">
    <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="profile" role="tabpanel" aria-labelledby="profile-tab">
        <p class="text-sm text-gray-500 dark:text-gray-400">
            Här hittar du information om våra körlektioner...
        </p>
    </div>
    <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="dashboard" role="tabpanel" aria-labelledby="dashboard-tab">
        <p class="text-sm text-gray-500 dark:text-gray-400">
            Här hittar du information om våra teorikurser...
        </p>
    </div>
    <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="settings" role="tabpanel" aria-labelledby="settings-tab">
        <p class="text-sm text-gray-500 dark:text-gray-400">
            Här hittar du information om vår handledarutbildning...
        </p>
    </div>
</div>
```

### **Data Display Components**

#### **Tables**
```html
<div class="relative overflow-x-auto shadow-md sm:rounded-lg">
    <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" class="px-6 py-3">
                    Datum
                </th>
                <th scope="col" class="px-6 py-3">
                    Tid
                </th>
                <th scope="col" class="px-6 py-3">
                    Typ
                </th>
                <th scope="col" class="px-6 py-3">
                    Status
                </th>
                <th scope="col" class="px-6 py-3">
                    Åtgärd
                </th>
            </tr>
        </thead>
        <tbody>
            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    2024-01-15
                </th>
                <td class="px-6 py-4">
                    09:00 - 17:00
                </td>
                <td class="px-6 py-4">
                    Handledarutbildning
                </td>
                <td class="px-6 py-4">
                    <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Bekräftad
                    </span>
                </td>
                <td class="px-6 py-4">
                    <a href="/bokning/123" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                        Visa detaljer
                    </a>
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

### **Form Components**

#### **Input Fields**
```html
<!-- Text Input -->
<div>
    <label for="name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        Fullständigt namn *
    </label>
    <input type="text" id="name" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Förnamn Efternamn" required>
</div>

<!-- Email Input -->
<div>
    <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        E-postadress *
    </label>
    <input type="email" id="email" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="namn@exempel.se" required>
</div>

<!-- Phone Input -->
<div>
    <label for="phone" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        Telefonnummer *
    </label>
    <input type="tel" id="phone" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="070-123 45 67" required>
</div>

<!-- Select Dropdown -->
<div>
    <label for="lesson-type" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        Lektyp
    </label>
    <select id="lesson-type" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
        <option value="korlektion">Körlektion</option>
        <option value="teori">Teorilektion</option>
        <option value="handledar">Handledarutbildning</option>
    </select>
</div>
```

### **Responsive Design Patterns**

#### **Mobile-First Grid**
```html
<!-- Responsive Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Content -->
</div>

<!-- Responsive Flex -->
<div class="flex flex-col md:flex-row gap-4">
    <!-- Content -->
</div>
```

#### **Responsive Images**
```html
<picture>
    <source media="(min-width: 768px)" srcset="/images/hero-desktop.jpg">
    <img src="/images/hero-mobile.jpg" alt="Trafikskola Hässleholm" class="w-full h-auto rounded-lg">
</picture>
```

#### **Responsive Typography**
```html
<h1 class="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">
    Responsive Heading
</h1>

<p class="text-sm md:text-base lg:text-lg">
    Responsive paragraph text
</p>
```

## 📱 **Mobile-Specific Guidelines**

### **Touch Targets**
- **Minimum 44px** for all interactive elements
- **Adequate spacing** between clickable elements
- **Clear visual feedback** for touch interactions

### **Content Hierarchy**
- **Prioritize above the fold** - most important content visible without scrolling
- **Progressive disclosure** - show additional information on demand
- **Clear navigation** - easy way back and forward

### **Performance**
- **Lazy loading** for images and components
- **Optimized images** for mobile networks
- **Minimal animations** to preserve battery life

## 🚀 **Implementation Strategy**

### **Step 1: Component Analysis**
- Review existing components against Flowbite patterns
- Identify replacement opportunities
- Plan migration strategy

### **Step 2: Progressive Implementation**
- Start with typography and basic components
- Move to complex layouts and interactions
- Test each change thoroughly

### **Step 3: Mobile Optimization**
- Ensure all components are touch-friendly
- Test on various mobile devices
- Optimize for mobile performance

### **Step 4: Accessibility**
- Maintain WCAG 2.1 AA compliance
- Ensure keyboard navigation works
- Test with screen readers

This comprehensive guide provides the foundation for implementing Flowbite components consistently across the TrafikskolaX application while maintaining Swedish localization and mobile-first design principles.
