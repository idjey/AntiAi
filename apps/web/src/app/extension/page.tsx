'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'
import { Download, Info, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'

type BrowserType = 'chrome' | 'firefox' | 'edge' | 'brave' | 'safari' | 'other'

// Extracted SVG components to keep the main component clean
const ChromeLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 48 48" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
        <defs>
            <linearGradient id="a" x1="3.2173" y1="15" x2="44.7812" y2="15" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#d93025" /><stop offset="1" stopColor="#ea4335" /></linearGradient>
            <linearGradient id="b" x1="20.7219" y1="47.6791" x2="41.5039" y2="11.6837" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#fcc934" /><stop offset="1" stopColor="#fbbc04" /></linearGradient>
            <linearGradient id="c" x1="26.5981" y1="46.5015" x2="5.8161" y2="10.506" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#1e8e3e" /><stop offset="1" stopColor="#34a853" /></linearGradient>
        </defs>
        <circle cx="24" cy="23.9947" r="12" style={{ fill: '#fff' }} />
        <path d="M3.2154,36A24,24,0,1,0,12,3.2154,24,24,0,0,0,3.2154,36ZM34.3923,18A12,12,0,1,1,18,13.6077,12,12,0,0,1,34.3923,18Z" style={{ fill: 'none' }} />
        <path d="M24,12H44.7812a23.9939,23.9939,0,0,0-41.5639.0029L13.6079,30l.0093-.0024A11.9852,11.9852,0,0,1,24,12Z" style={{ fill: 'url(#a)' }} />
        <circle cx="24" cy="24" r="9.5" style={{ fill: '#1a73e8' }} />
        <path d="M34.3913,30.0029,24.0007,48A23.994,23.994,0,0,0,44.78,12.0031H23.9989l-.0025.0093A11.985,11.985,0,0,1,34.3913,30.0029Z" style={{ fill: 'url(#b)' }} />
        <path d="M13.6086,30.0031,3.218,12.006A23.994,23.994,0,0,0,24.0025,48L34.3931,30.0029l-.0067-.0068a11.9852,11.9852,0,0,1-20.7778.007Z" style={{ fill: 'url(#c)' }} />
    </svg>
)

const FirefoxLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
        <defs><radialGradient id="g" cx="210%" cy="-100%" r="290%"><stop offset=".1" stopColor="#ffe226" /><stop offset=".79" stopColor="#ff7139" /></radialGradient><radialGradient id="c" cx="49%" cy="40%" r="128%" gradientTransform="matrix(.82 0 0 1 .088 0)"><stop offset=".3" stopColor="#960e18" /><stop offset=".35" stopColor="#b11927" stopOpacity=".74" /><stop offset=".43" stopColor="#db293d" stopOpacity=".34" /><stop offset=".5" stopColor="#f5334b" stopOpacity=".09" /><stop offset=".53" stopColor="#ff3750" stopOpacity="0" /></radialGradient><radialGradient id="d" cx="48%" cy="-12%" r="140%"><stop offset=".13" stopColor="#fff44f" /><stop offset=".53" stopColor="#ff980e" /></radialGradient><radialGradient id="e" cx="22.76%" cy="110.11%" r="100%"><stop offset=".35" stopColor="#3a8ee6" /><stop offset=".67" stopColor="#9059ff" /><stop offset="1" stopColor="#c139e6" /></radialGradient><radialGradient id="f" cx="52%" cy="33%" r="59%" gradientTransform="scale(.9 1)"><stop offset=".21" stopColor="#9059ff" stopOpacity="0" /><stop offset=".97" stopColor="#6e008b" stopOpacity=".6" /></radialGradient><radialGradient id="b" cx="87.4%" cy="-12.9%" r="128%" gradientTransform="matrix(.8 0 0 1 .178 .129)"><stop offset=".13" stopColor="#ffbd4f" /><stop offset=".28" stopColor="#ff980e" /><stop offset=".47" stopColor="#ff3750" /><stop offset=".78" stopColor="#eb0878" /><stop offset=".86" stopColor="#e50080" /></radialGradient><radialGradient id="h" cx="84%" cy="-41%" r="180%"><stop offset=".11" stopColor="#fff44f" /><stop offset=".46" stopColor="#ff980e" /><stop offset=".72" stopColor="#ff3647" /><stop offset=".9" stopColor="#e31587" /></radialGradient><radialGradient id="i" cx="16.1%" cy="-18.6%" r="348.8%" gradientTransform="scale(1 .47) rotate(84 .279 -.297)"><stop offset="0" stopColor="#fff44f" /><stop offset=".3" stopColor="#ff980e" /><stop offset=".57" stopColor="#ff3647" /><stop offset=".74" stopColor="#e31587" /></radialGradient><radialGradient id="j" cx="18.9%" cy="-42.5%" r="238.4%"><stop offset=".14" stopColor="#fff44f" /><stop offset=".48" stopColor="#ff980e" /><stop offset=".66" stopColor="#ff3647" /><stop offset=".9" stopColor="#e31587" /></radialGradient><radialGradient id="k" cx="159.3%" cy="-44.72%" r="313.1%"><stop offset=".09" stopColor="#fff44f" /><stop offset=".63" stopColor="#ff980e" /></radialGradient><linearGradient id="a" x1="87.25%" y1="15.5%" x2="9.4%" y2="93.1%"><stop offset=".05" stopColor="#fff44f" /><stop offset=".37" stopColor="#ff980e" /><stop offset=".53" stopColor="#ff3647" /><stop offset=".7" stopColor="#e31587" /></linearGradient><linearGradient id="l" x1="80%" y1="14%" x2="18%" y2="84%"><stop offset=".17" stopColor="#fff44f" stopOpacity=".8" /><stop offset=".6" stopColor="#fff44f" stopOpacity="0" /></linearGradient></defs><path d="M478.711 166.353c-10.445-25.124-31.6-52.248-48.212-60.821 13.52 26.505 21.345 53.093 24.335 72.936 0 .039.015.136.047.4C427.706 111.135 381.627 83.823 344 24.355c-1.9-3.007-3.805-6.022-5.661-9.2a73.716 73.716 0 01-2.646-4.972A43.7 43.7 0 01332.1.677a.626.626 0 00-.546-.644.818.818 0 00-.451 0c-.034.012-.084.051-.12.065-.053.021-.12.069-.176.1.027-.036.083-.117.1-.136-60.37 35.356-80.85 100.761-82.732 133.484a120.249 120.249 0 00-66.142 25.488 71.355 71.355 0 00-6.225-4.7 111.338 111.338 0 01-.674-58.732c-24.688 11.241-43.89 29.01-57.85 44.7h-.111c-9.527-12.067-8.855-51.873-8.312-60.184-.114-.515-7.107 3.63-8.023 4.255a175.073 175.073 0 00-23.486 20.12 210.478 210.478 0 00-22.442 26.913c0 .012-.007.026-.011.038 0-.013.007-.026.011-.038a202.838 202.838 0 00-32.247 72.805c-.115.521-.212 1.061-.324 1.586-.452 2.116-2.08 12.7-2.365 15-.022.177-.032.347-.053.524a229.066 229.066 0 00-3.9 33.157c0 .41-.025.816-.025 1.227C16 388.418 123.6 496 256.324 496c118.865 0 217.56-86.288 236.882-199.63.407-3.076.733-6.168 1.092-9.271 4.777-41.21-.53-84.525-15.587-120.746zM201.716 354.447c1.124.537 2.18 1.124 3.334 1.639.048.033.114.07.163.1a126.191 126.191 0 01-3.497-1.739zm55.053-144.93zm198.131-30.59l-.032-.233c.012.085.027.174.04.259z" fill="url(#a)" /><path d="M478.711 166.353c-10.445-25.124-31.6-52.248-48.212-60.821 13.52 26.505 21.345 53.093 24.335 72.936 0-.058.011.048.036.226.012.085.027.174.04.259 22.675 61.47 10.322 123.978-7.479 162.175-27.539 59.1-94.215 119.67-198.576 116.716C136.1 454.651 36.766 370.988 18.223 261.41c-3.379-17.28 0-26.054 1.7-40.084-2.071 10.816-2.86 13.94-3.9 33.157 0 .41-.025.816-.025 1.227C16 388.418 123.6 496 256.324 496c118.865 0 217.56-86.288 236.882-199.63.407-3.076.733-6.168 1.092-9.271 4.777-41.21-.53-84.525-15.587-120.746z" fill="url(#b)" /><path d="M478.711 166.353c-10.445-25.124-31.6-52.248-48.212-60.821 13.52 26.505 21.345 53.093 24.335 72.936 0-.058.011.048.036.226.012.085.027.174.04.259 22.675 61.47 10.322 123.978-7.479 162.175-27.539 59.1-94.215 119.67-198.576 116.716C136.1 454.651 36.766 370.988 18.223 261.41c-3.379-17.28 0-26.054 1.7-40.084-2.071 10.816-2.86 13.94-3.9 33.157 0 .41-.025.816-.025 1.227C16 388.418 123.6 496 256.324 496c118.865 0 217.56-86.288 236.882-199.63.407-3.076.733-6.168 1.092-9.271 4.777-41.21-.53-84.525-15.587-120.746z" fill="url(#c)" /><path d="M361.922 194.6c.524.368 1 .734 1.493 1.1a130.706 130.706 0 00-22.31-29.112C266.4 91.892 321.516 4.626 330.811.194c.027-.036.083-.117.1-.136-60.37 35.356-80.85 100.761-82.732 133.484 2.8-.194 5.592-.429 8.442-.429 45.051 0 84.289 24.77 105.301 61.487z" fill="url(#d)" /><path d="M256.772 209.514c-.393 5.978-21.514 26.593-28.9 26.593-68.339 0-79.432 41.335-79.432 41.335 3.027 34.81 27.261 63.475 56.611 78.643 1.339.692 2.694 1.317 4.05 1.935a132.768 132.768 0 007.059 2.886 106.743 106.743 0 0031.271 6.031c119.78 5.618 142.986-143.194 56.545-186.408 22.137-3.85 45.115 5.053 57.947 14.067-21.012-36.714-60.25-61.484-105.3-61.484-2.85 0-5.641.235-8.442.429a120.249 120.249 0 00-66.142 25.488c3.664 3.1 7.8 7.244 16.514 15.828 16.302 16.067 58.13 32.705 58.219 34.657z" fill="url(#e)" /><path d="M256.772 209.514c-.393 5.978-21.514 26.593-28.9 26.593-68.339 0-79.432 41.335-79.432 41.335 3.027 34.81 27.261 63.475 56.611 78.643 1.339.692 2.694 1.317 4.05 1.935a132.768 132.768 0 007.059 2.886 106.743 106.743 0 0031.271 6.031c119.78 5.618 142.986-143.194 56.545-186.408 22.137-3.85 45.115 5.053 57.947 14.067-21.012-36.714-60.25-61.484-105.3-61.484-2.85 0-5.641.235-8.442.429a120.249 120.249 0 00-66.142 25.488c3.664 3.1 7.8 7.244 16.514 15.828 16.302 16.067 58.13 32.705 58.219 34.657z" fill="url(#f)" /><path d="M170.829 151.036a244.042 244.042 0 014.981 3.3 111.338 111.338 0 01-.674-58.732c-24.688 11.241-43.89 29.01-57.85 44.7 1.155-.033 36.014-.66 53.543 10.732z" fill="url(#g)" /><path d="M18.223 261.41C36.766 370.988 136.1 454.651 248.855 457.844c104.361 2.954 171.037-57.62 198.576-116.716 17.8-38.2 30.154-100.7 7.479-162.175l-.008-.026-.032-.233c-.025-.178-.04-.284-.036-.226 0 .039.015.136.047.4 8.524 55.661-19.79 109.584-64.051 146.044l-.133.313c-86.245 70.223-168.774 42.368-185.484 30.966a144.108 144.108 0 01-3.5-1.743c-50.282-24.029-71.054-69.838-66.6-109.124-42.457 0-56.934-35.809-56.934-35.809s38.119-27.179 88.358-3.541c46.53 21.893 90.228 3.543 90.233 3.541-.089-1.952-41.917-18.59-58.223-34.656-8.713-8.584-12.85-12.723-16.514-15.828a71.355 71.355 0 00-6.225-4.7 282.929 282.929 0 00-4.981-3.3c-17.528-11.392-52.388-10.765-53.543-10.735h-.111c-9.527-12.067-8.855-51.873-8.312-60.184-.114-.515-7.107 3.63-8.023 4.255a175.073 175.073 0 00-23.486 20.12 210.478 210.478 0 00-22.442 26.919c0 .012-.007.026-.011.038 0-.013.007-.026.011-.038a202.838 202.838 0 00-32.247 72.805c-.115.521-8.65 37.842-4.44 57.199z" fill="url(#h)" /><path d="M341.105 166.587a130.706 130.706 0 0122.31 29.112c1.323.994 2.559 1.985 3.608 2.952 54.482 50.2 25.936 121.2 23.807 126.26 44.261-36.46 72.575-90.383 64.051-146.044C427.706 111.135 381.627 83.823 344 24.355c-1.9-3.007-3.805-6.022-5.661-9.2a73.716 73.716 0 01-2.646-4.972A43.7 43.7 0 01332.1.677a.626.626 0 00-.546-.644.818.818 0 00-.451 0c-.034.012-.084.051-.12.065-.053.021-.12.069-.176.1-9.291 4.428-64.407 91.694 10.298 166.389z" fill="url(#i)" /><path d="M367.023 198.651c-10.49-.967-2.285-1.958-3.608-2.952-.489-.368-.969-.734-1.493-1.1-12.832-9.014-35.81-17.917-57.947-14.067 86.441 43.214 63.235 192.026-56.545 186.408a106.743 106.743 0 01-31.271-6.031 134.51 134.51 0 01-7.059-2.886c-1.356-.618-2.711-1.243-4.05-1.935.048.033.114.07.163.1 16.71 11.4 99.239 39.257 185.484-30.966l.133-.313c2.129-5.054 30.675-76.057-23.807-126.258z" fill="url(#j)" /><path d="M148.439 277.443s11.093-41.335 79.432-41.335c7.388 0 28.509-20.615 28.9-26.593s-43.7 18.352-90.233-3.541c-50.239-23.638-88.358 3.541-88.358 3.541s14.477 35.809 56.934 35.809c-4.453 39.286 16.319 85.1 66.6 109.124 1.124.537 2.18 1.124 3.334 1.639-29.348-15.169-53.582-43.834-56.609-78.644z" fill="url(#k)" /><path d="M478.711 166.353c-10.445-25.124-31.6-52.248-48.212-60.821 13.52 26.505 21.345 53.093 24.335 72.936 0 .039.015.136.047.4C427.706 111.135 381.627 83.823 344 24.355c-1.9-3.007-3.805-6.022-5.661-9.2a73.716 73.716 0 01-2.646-4.972A43.7 43.7 0 01332.1.677a.626.626 0 00-.546-.644.818.818 0 00-.451 0c-.034.012-.084.051-.12.065-.053.021-.12.069-.176.1.027-.036.083-.117.1-.136-60.37 35.356-80.85 100.761-82.732 133.484 2.8-.194 5.592-.429 8.442-.429 45.053 0 84.291 24.77 105.3 61.484-12.832-9.014-35.81-17.917-57.947-14.067 86.441 43.214 63.235 192.026-56.545 186.408a106.743 106.743 0 01-31.271-6.031 134.51 134.51 0 01-7.059-2.886c-1.356-.618-2.711-1.243-4.05-1.935.048.033.114.07.163.1a144.108 144.108 0 01-3.5-1.743c1.124.537 2.18 1.124 3.334 1.639-29.35-15.168-53.584-43.833-56.611-78.643 0 0 11.093-41.335 79.432-41.335 7.388 0 28.509-20.615 28.9-26.593-.089-1.952-41.917-18.59-58.223-34.656-8.713-8.584-12.85-12.723-16.514-15.828a71.355 71.355 0 00-6.225-4.7 111.338 111.338 0 01-.674-58.732c-24.688 11.241-43.89 29.01-57.85 44.7h-.111c-9.527-12.067-8.855-51.873-8.312-60.184-.114-.515-7.107 3.63-8.023 4.255a175.073 175.073 0 00-23.486 20.12 210.478 210.478 0 00-22.435 26.916c0 .012-.007.026-.011.038 0-.013.007-.026.011-.038a202.838 202.838 0 00-32.247 72.805c-.115.521-.212 1.061-.324 1.586-.452 2.116-2.486 12.853-2.77 15.156-.022.177.021-.176 0 0a279.565 279.565 0 00-3.544 33.53c0 .41-.025.816-.025 1.227C16 388.418 123.6 496 256.324 496c118.865 0 217.56-86.288 236.882-199.63.407-3.076.733-6.168 1.092-9.271 4.777-41.21-.53-84.525-15.587-120.746zm-23.841 12.341c.012.085.027.174.04.259l-.008-.026-.032-.233z" fill="url(#l)" /></svg>
)

const EdgeLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
        <defs>
            <radialGradient id="b" cx="161.8" cy="68.9" r="95.4" gradientTransform="matrix(1 0 0 -.95 0 248.8)" gradientUnits="userSpaceOnUse"><stop offset=".7" stopOpacity="0" /><stop offset=".9" stopOpacity=".5" /><stop offset="1" /></radialGradient>
            <radialGradient id="d" cx="-340.3" cy="63" r="143.2" gradientTransform="matrix(.15 -.99 -.8 -.12 176.6 -125.4)" gradientUnits="userSpaceOnUse"><stop offset=".8" stopOpacity="0" /><stop offset=".9" stopOpacity=".5" /><stop offset="1" /></radialGradient>
            <radialGradient id="e" cx="113.4" cy="570.2" r="202.4" gradientTransform="matrix(-.04 1 2.13 .08 -1179.5 -106.7)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#35c1f1" /><stop offset=".1" stopColor="#34c1ed" /><stop offset=".2" stopColor="#2fc2df" /><stop offset=".3" stopColor="#2bc3d2" /><stop offset=".7" stopColor="#36c752" /></radialGradient>
            <radialGradient id="f" cx="376.5" cy="568" r="97.3" gradientTransform="matrix(.28 .96 .78 -.23 -303.8 -148.5)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#66eb6e" /><stop offset="1" stopColor="#66eb6e" stopOpacity="0" /></radialGradient>
            <linearGradient id="a" x1="63.3" y1="84" x2="241.7" y2="84" gradientTransform="matrix(1 0 0 -1 0 266)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#0c59a4" /><stop offset="1" stopColor="#114a8b" /></linearGradient>
            <linearGradient id="c" x1="157.3" y1="161.4" x2="46" y2="40.1" gradientTransform="matrix(1 0 0 -1 0 266)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#1b9de2" /><stop offset=".2" stopColor="#1595df" /><stop offset=".7" stopColor="#0680d7" /><stop offset="1" stopColor="#0078d4" /></linearGradient>
        </defs>
        <path d="M235.7 195.5a93.7 93.7 0 0 1-10.6 4.7 101.9 101.9 0 0 1-35.9 6.4c-47.3 0-88.5-32.5-88.5-74.3a31.5 31.5 0 0 1 16.4-27.3c-42.8 1.8-53.8 46.4-53.8 72.5 0 74 68.1 81.4 82.8 81.4 7.9 0 19.8-2.3 27-4.6l1.3-.4a128.3 128.3 0 0 0 66.6-52.8 4 4 0 0 0-5.3-5.6Z" transform="translate(-4.6 -5)" style={{ fill: 'url(#a)' }} />
        <path d="M235.7 195.5a93.7 93.7 0 0 1-10.6 4.7 101.9 101.9 0 0 1-35.9 6.4c-47.3 0-88.5-32.5-88.5-74.3a31.5 31.5 0 0 1 16.4-27.3c-42.8 1.8-53.8 46.4-53.8 72.5 0 74 68.1 81.4 82.8 81.4 7.9 0 19.8-2.3 27-4.6l1.3-.4a128.3 128.3 0 0 0 66.6-52.8 4 4 0 0 0-5.3-5.6Z" transform="translate(-4.6 -5)" style={{ isolation: 'isolate', opacity: '.35', fill: 'url(#b)' }} />
        <path d="M110.3 246.3A79.2 79.2 0 0 1 87.6 225a80.7 80.7 0 0 1 29.5-120c3.2-1.5 8.5-4.1 15.6-4a32.4 32.4 0 0 1 25.7 13 31.9 31.9 0 0 1 6.3 18.7c0-.2 24.5-79.6-80-79.6-43.9 0-80 41.6-80 78.2a130.2 130.2 0 0 0 12.1 56 128 128 0 0 0 156.4 67 75.5 75.5 0 0 1-62.8-8Z" transform="translate(-4.6 -5)" style={{ fill: 'url(#c)' }} />
        <path d="M110.3 246.3A79.2 79.2 0 0 1 87.6 225a80.7 80.7 0 0 1 29.5-120c3.2-1.5 8.5-4.1 15.6-4a32.4 32.4 0 0 1 25.7 13 31.9 31.9 0 0 1 6.3 18.7c0-.2 24.5-79.6-80-79.6-43.9 0-80 41.6-80 78.2a130.2 130.2 0 0 0 12.1 56 128 128 0 0 0 156.4 67 75.5 75.5 0 0 1-62.8-8Z" transform="translate(-4.6 -5)" style={{ opacity: '.41', fill: 'url(#d)', isolation: 'isolate' }} />
        <path d="M157 153.8c-.9 1-3.4 2.5-3.4 5.6 0 2.6 1.7 5.2 4.8 7.3 14.3 10 41.4 8.6 41.5 8.6a59.6 59.6 0 0 0 30.3-8.3 61.4 61.4 0 0 0 30.4-52.9c.3-22.4-8-37.3-11.3-43.9C228 28.8 182.3 5 132.6 5a128 128 0 0 0-128 126.2c.5-36.5 36.8-66 80-66 3.5 0 23.5.3 42 10a72.6 72.6 0 0 1 30.9 29.3c6.1 10.6 7.2 24.1 7.2 29.5s-2.7 13.3-7.8 19.9Z" transform="translate(-4.6 -5)" style={{ fill: 'url(#e)' }} />
        <path d="M157 153.8c-.9 1-3.4 2.5-3.4 5.6 0 2.6 1.7 5.2 4.8 7.3 14.3 10 41.4 8.6 41.5 8.6a59.6 59.6 0 0 0 30.3-8.3 61.4 61.4 0 0 0 30.4-52.9c.3-22.4-8-37.3-11.3-43.9C228 28.8 182.3 5 132.6 5a128 128 0 0 0-128 126.2c.5-36.5 36.8-66 80-66 3.5 0 23.5.3 42 10a72.6 72.6 0 0 1 30.9 29.3c6.1 10.6 7.2 24.1 7.2 29.5s-2.7 13.3-7.8 19.9Z" transform="translate(-4.6 -5)" style={{ fill: 'url(#f)' }} />
    </svg>
)

const BraveLogo = () => (
    <svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 436.49 511.97" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
        <defs>
            <linearGradient id="linearGradientBrave" x1="-18.79" y1="359.73" x2="194.32" y2="359.73" gradientTransform="matrix(2.05, 0, 0, -2.05, 38.49, 992.77)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#f1562b" /><stop offset="0.3" stopColor="#f1542b" /><stop offset="0.41" stopColor="#f04d2a" /><stop offset="0.49" stopColor="#ef4229" /><stop offset="0.5" stopColor="#ef4029" /><stop offset="0.56" stopColor="#e83e28" /><stop offset="0.67" stopColor="#e13c26" /><stop offset="1" stopColor="#df3c26" /></linearGradient>
        </defs>
        <path style={{ fill: 'url(#linearGradientBrave)' }} d="M436.49,165.63,420.7,122.75l11-24.6A8.47,8.47,0,0,0,430,88.78L400.11,58.6a48.16,48.16,0,0,0-50.23-11.66l-8.19,2.89L296.09.43,218.25,0,140.4.61,94.85,50.41l-8.11-2.87A48.33,48.33,0,0,0,36.19,59.3L5.62,90.05a6.73,6.73,0,0,0-1.36,7.47l11.47,25.56L0,165.92,56.47,380.64a89.7,89.7,0,0,0,34.7,50.23l111.68,75.69a24.73,24.73,0,0,0,30.89,0l111.62-75.8A88.86,88.86,0,0,0,380,380.53l46.07-176.14Z" />
        <path style={{ fill: '#fff' }} d="M231,317.33a65.61,65.61,0,0,0-9.11-3.3h-5.49a66.08,66.08,0,0,0-9.11,3.3l-13.81,5.74-15.6,7.18-25.4,13.24a4.84,4.84,0,0,0-.62,9l22.06,15.49q7,5,13.55,10.76l6.21,5.35,13,11.37,5.89,5.2a10.15,10.15,0,0,0,12.95,0l25.39-22.18,13.6-10.77,22.06-15.79a4.8,4.8,0,0,0-.68-8.93l-25.36-12.8L244.84,323ZM387.4,175.2l.8-2.3a61.26,61.26,0,0,0-.57-9.18,73.51,73.51,0,0,0-8.19-15.44l-14.35-21.06-10.22-13.88-19.23-24a69.65,69.65,0,0,0-5.7-6.67h-.4L321,84.25l-42.27,8.14a33.49,33.49,0,0,1-12.59-1.84l-23.21-7.5-16.61-4.59a70.52,70.52,0,0,0-14.67,0L195,83.1l-23.21,7.54a33.89,33.89,0,0,1-12.59,1.84l-42.22-8-8.54-1.58h-.4a65.79,65.79,0,0,0-5.7,6.67l-19.2,24Q77.81,120.32,73,127.45L58.61,148.51l-6.78,11.31a51,51,0,0,0-1.94,13.35l.8,2.3A34.51,34.51,0,0,0,52,179.81l11.33,13,50.23,53.39a14.31,14.31,0,0,1,2.55,14.34L107.68,280a25.23,25.23,0,0,0-.39,16l1.64,4.52a43.58,43.58,0,0,0,13.39,18.76l7.89,6.43a15,15,0,0,0,14.35,1.72L172.62,314A70.38,70.38,0,0,0,187,304.52l22.46-20.27a9,9,0,0,0,3-6.36,9.08,9.08,0,0,0-2.5-6.56L159.2,237.18a9.83,9.83,0,0,1-3.09-12.45l19.66-36.95a19.21,19.21,0,0,0,1-14.67A22.37,22.37,0,0,0,165.58,163L103.94,139.8c-4.44-1.6-4.2-3.6.51-3.88l36.2-3.59a55.9,55.9,0,0,1,16.9,1.5l31.5,8.8a9.64,9.64,0,0,1,6.74,10.76L183.42,221a34.72,34.72,0,0,0-.61,11.41c.5,1.61,4.73,3.6,9.36,4.73l19.19,4a46.38,46.38,0,0,0,16.86,0l17.26-4c4.64-1,8.82-3.23,9.35-4.85a34.94,34.94,0,0,0-.63-11.4l-12.45-67.59a9.66,9.66,0,0,1,6.74-10.76l31.5-8.83a55.87,55.87,0,0,1,16.9-1.5l36.2,3.37c4.74.44,5,2.2.54,3.88L272,162.79a22.08,22.08,0,0,0-11.16,10.12,19.3,19.3,0,0,0,1,14.67l19.69,36.95A9.84,9.84,0,0,1,278.45,237l-50.66,34.23a9,9,0,0,0,.32,12.78l.15.14,22.49,20.27a71.46,71.46,0,0,0,14.35,9.47l28.06,13.35a14.89,14.89,0,0,0,14.34-1.76l7.9-6.45a43.53,43.53,0,0,0,13.38-18.8l1.65-4.52a25.27,25.27,0,0,0-.39-16l-8.26-19.49a14.4,14.4,0,0,1,2.55-14.35l50.23-53.45,11.3-13a35.8,35.8,0,0,0,1.54-4.24Z" />
    </svg>
)


export default function ExtensionDownloadPage() {
    const [browser, setBrowser] = useState<BrowserType>('other')
    const [mounted, setMounted] = useState(false)

    // Store Links
    const LINKS = {
        chrome: "https://chrome.google.com/webstore/detail/antiai", // Update with actual CWS ID when deployed
        firefox: "https://addons.mozilla.org/en-US/firefox/addon/antiai-me/",
        edge: "https://microsoftedge.microsoft.com/addons/detail/antiai", // Update with actual Edge ID
        brave: "https://chrome.google.com/webstore/detail/antiai", // Brave uses Chrome store
    }

    useEffect(() => {
        setMounted(true)
        const ua = window.navigator.userAgent.toLowerCase()

        if (ua.includes('firefox')) {
            setBrowser('firefox')
        } else if (ua.includes('edg/')) {
            setBrowser('edge')
        } else if (ua.includes('brave')) {
            // Brave doesn't reliably expose itself in UA anymore, but just in case
            setBrowser('brave')
        } else if (ua.includes('chrome') && !ua.includes('edg/')) {
            // Check for navigator.brave asynchronously (optional, but Chrome is safe fallback)
            // @ts-ignore
            if (navigator.brave && navigator.brave.isBrave) {
                setBrowser('brave')
            } else {
                setBrowser('chrome')
            }
        } else if (ua.includes('safari') && !ua.includes('chrome')) {
            setBrowser('safari')
        } else {
            setBrowser('other')
        }
    }, [])

    // Prevent hydration mismatch
    if (!mounted) return null

    const renderPrimaryCTA = () => {
        if (browser === 'safari') {
            return (
                <div className="flex flex-col items-center bg-surface-light border border-white/10 rounded-2xl p-8 max-w-md mx-auto text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Safari is not supported yet</h2>
                    <p className="text-slate-400 mb-6">
                        The AntiAI extension is currently available for Chromium-based browsers and Firefox. Safari support is coming soon!
                    </p>
                    <Link href="/" className="btn-secondary">Return to Homepage</Link>
                </div>
            )
        }

        const browserMap: Record<Exclude<BrowserType, 'safari' | 'other'>, { name: string, icon: JSX.Element, bg: string }> = {
            chrome: { name: 'Google Chrome', icon: <ChromeLogo />, bg: 'hover:border-blue-500/50 hover:bg-blue-500/5' },
            firefox: { name: 'Mozilla Firefox', icon: <FirefoxLogo />, bg: 'hover:border-orange-500/50 hover:bg-orange-500/5' },
            edge: { name: 'Microsoft Edge', icon: <EdgeLogo />, bg: 'hover:border-cyan-500/50 hover:bg-cyan-500/5' },
            brave: { name: 'Brave Browser', icon: <BraveLogo />, bg: 'hover:border-orange-500/50 hover:bg-orange-500/5' },
        }

        const currentConf = browser !== 'other' ? browserMap[browser] : browserMap['chrome']
        const currentLink = browser !== 'other' ? LINKS[browser] : LINKS['chrome']

        return (
            <div className={`group flex flex-col items-center bg-[#111] backdrop-blur-sm border border-white/5 rounded-3xl p-10 max-w-xl mx-auto text-center ${currentConf.bg} transition-all duration-500 shadow-xl relative overflow-hidden`}>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                    <div className="mb-8 flex justify-center">
                        {currentConf.icon}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                        Install for {currentConf.name}
                    </h2>

                    <p className="text-slate-400 text-lg mb-8 max-w-sm mx-auto">
                        Instantly see cryptographic verification badges directly on YouTube. Protect yourself from deepfakes.
                    </p>

                    <a
                        href={currentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center btn-primary-lg w-full sm:w-auto shadow-primary/30 shadow-lg text-lg group-hover:scale-105 transition-transform duration-300"
                    >
                        <Download className="w-5 h-5 mr-3" />
                        Add to {currentConf.name}
                    </a>

                    <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-center gap-6 text-sm text-slate-500">
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Free forever</span>
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> No tracking</span>
                        <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Open source</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen flex flex-col bg-[#0A0A0A]">
            <Navbar />

            <div className="flex-1 flex flex-col justify-center py-24 relative overflow-hidden">
                {/* Ambient Backgrounds */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

                <div className="container-custom relative z-10 text-center">
                    <header className="mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                            <ShieldCheck className="w-4 h-4" />
                            <span>AntiAI Protocol Extension</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-white">
                            Get the Extension
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Know exactly who created a video before you even press play.
                        </p>
                    </header>

                    {/* Primary Detected Download Component */}
                    {renderPrimaryCTA()}

                    {/* Alternative Browser Links */}
                    {browser !== 'safari' && (
                        <div className="mt-24">
                            <h3 className="text-slate-500 font-medium mb-8">Looking for another browser?</h3>
                            <div className="flex flex-wrap justify-center gap-6">
                                {browser !== 'chrome' && (
                                    <a href={LINKS.chrome} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 rounded-xl bg-surface border border-white/5 hover:border-blue-500/30 hover:bg-surface-light transition-all text-slate-300 hover:text-white">
                                        <div className="w-6 h-6"><ChromeLogo /></div>
                                        <span className="font-semibold">Google Chrome</span>
                                    </a>
                                )}
                                {browser !== 'firefox' && (
                                    <a href={LINKS.firefox} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 rounded-xl bg-surface border border-white/5 hover:border-orange-500/30 hover:bg-surface-light transition-all text-slate-300 hover:text-white">
                                        <div className="w-6 h-6"><FirefoxLogo /></div>
                                        <span className="font-semibold">Mozilla Firefox</span>
                                    </a>
                                )}
                                {browser !== 'edge' && (
                                    <a href={LINKS.edge} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 rounded-xl bg-surface border border-white/5 hover:border-cyan-500/30 hover:bg-surface-light transition-all text-slate-300 hover:text-white">
                                        <div className="w-6 h-6"><EdgeLogo /></div>
                                        <span className="font-semibold">Microsoft Edge</span>
                                    </a>
                                )}
                                {browser !== 'brave' && browser !== 'chrome' && (
                                    <a href={LINKS.brave} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 rounded-xl bg-surface border border-white/5 hover:border-orange-500/30 hover:bg-surface-light transition-all text-slate-300 hover:text-white">
                                        <div className="w-6 h-6"><BraveLogo /></div>
                                        <span className="font-semibold">Brave</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    )
}
