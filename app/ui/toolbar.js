// @ts-nocheck
import { save, remove, upload } from "../utils/saveEdit.js";
import {
  canvasToJsonData,
  downloadImage,
  downloadSVG,
} from "../utils/utils.js";
import { openEditRepository } from "./EditRepository.js";
/**
 * 상,하단 툴바
 */

("use strict");
const defaultButtons = [
  {
    name: "select",
    title: "선택/이동",
    icon: `<svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><path d="M423.547,323.115l-320-320c-3.051-3.051-7.637-3.947-11.627-2.304s-6.592,5.547-6.592,9.856V480 c0,4.501,2.837,8.533,7.083,10.048c4.224,1.536,8.981,0.192,11.84-3.285l85.205-104.128l56.853,123.179 c1.792,3.883,5.653,6.187,9.685,6.187c1.408,0,2.837-0.277,4.203-0.875l74.667-32c2.645-1.131,4.736-3.285,5.76-5.973 c1.024-2.688,0.939-5.675-0.277-8.299l-57.024-123.52h132.672c4.309,0,8.213-2.603,9.856-6.592 C427.515,330.752,426.598,326.187,423.547,323.115z"></path></g></g></svg>`,
  },
  {
    name: "hand",
    title: "캔버스 이동",
    icon: `<svg fill="#000000" viewBox="3 4 25 25" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>hand</title> <path d="M20.903 24.014l2.959-3.984 3.475-3.32c0 0-1.158-1.381-2.59-1.381-0.643 0-1.232 0.184-1.77 0.552-0.535 0.367-1.023 0.918-1.463 1.655-0.615 0.215-1.094 0.42-1.438 0.615-0.076-0.766-0.168-1.333-0.275-1.7l1.996-7.748c0.473-1.868 0.586-2.812-0.539-3.312s-2.275 0.879-2.867 2.637l-1.893 5.983 0.057-7.694c0-1.889-0.596-2.833-1.788-2.833-1.204 0-1.805 0.837-1.805 2.51v7.692l-1.936-6.738c-0.48-1.192-1.325-2.366-2.45-1.991s-1.072 2.226-0.76 3.411l1.725 6.569-2.782-4.595c-0.851-1.475-2.319-1.76-2.651-1.416-0.529 0.549-0.883 1.717 0.077 3.394l3.069 5.343 2.74 9.492v1.845h8v-2.379c0.929-0.637 1.732-1.506 2.909-2.607v0z"></path> </g></svg>`,
  },
  {
    name: "shapes",
    title: "도형",
    icon: `<svg id="Capa_1" x="0px" y="0px" viewBox="0 0 490.927 490.927" xml:space="preserve"><path d="M336.738,178.502c-12.645,0-24.852,1.693-36.627,4.582L202.57,11.786c-5.869-10.321-22.84-10.321-28.709,0L2.163,313.311 c-2.906,5.105-2.889,11.385,0.078,16.466c2.953,5.088,8.389,8.216,14.275,8.216l166.314,0.009 c2.818,82.551,70.688,148.88,153.906,148.88c85.012,0,154.19-69.167,154.19-154.186S421.749,178.502,336.738,178.502z  M44.917,304.964l143.299-251.63L331.515,304.97L44.917,304.964z"></path></svg>`,
  },
  {
    name: "draw",
    title: "펜",
    icon: `<svg height="512pt" viewBox="0 -3 512 512" width="512pt"><g id="surface1"><path d="M 497.171875 86.429688 C 506.734375 76.867188 512 64.152344 512 50.628906 C 512 37.105469 506.734375 24.390625 497.171875 14.828125 C 487.609375 5.265625 474.894531 0 461.371094 0 C 447.847656 0 435.132812 5.265625 425.570312 14.828125 L 198.296875 242.105469 L 269.894531 313.703125 Z M 497.171875 86.429688 " style="stroke: none; fill-rule: nonzero; fill: rgb(0, 0, 0); fill-opacity: 1;"></path><path d="M 65.839844 506.65625 C 92.171875 507.21875 130.371094 496.695312 162.925781 459.074219 C 164.984375 456.691406 166.894531 454.285156 168.664062 451.855469 C 179.460938 435.875 184.695312 418.210938 183.855469 400.152344 C 182.945312 380.5625 174.992188 362.324219 161.460938 348.796875 C 150.28125 337.613281 134.722656 331.457031 117.648438 331.457031 C 95.800781 331.457031 73.429688 341.296875 56.277344 358.449219 C 31.574219 383.152344 31.789062 404.234375 31.976562 422.839844 C 32.15625 440.921875 32.316406 456.539062 11.101562 480.644531 L 0 493.257812 C 0 493.257812 26.828125 505.820312 65.839844 506.65625 Z M 65.839844 506.65625 " style="stroke: none; fill-rule: nonzero; fill: rgb(0, 0, 0); fill-opacity: 1;"></path><path d="M 209.980469 373.621094 L 248.496094 335.101562 L 176.894531 263.503906 L 137.238281 303.160156 C 154.691406 306.710938 170.464844 315 182.859375 327.394531 C 195.746094 340.285156 205.003906 356.1875 209.980469 373.621094 Z M 209.980469 373.621094 " style="stroke: none; fill-rule: nonzero; fill: rgb(0, 0, 0); fill-opacity: 1;"></path></g></svg>`,
  },
  {
    name: "line",
    title: "선",
    icon: `<svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><path d="M349.091,0v124.516L124.516,349.091H0V512h162.909V387.484l224.574-224.574H512V0H349.091z M54.303,457.696v-54.303 h54.303v54.303H54.303z M457.696,108.605h-54.303V54.303h54.303V108.605z"></path></svg>`,
  },
  {
    name: "arrow",
    title: "화살표",
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M21 7C21 7.55228 21.4477 8 22 8C22.5523 8 23 7.55228 23 7V3C23 1.89543 22.1046 1 21 1H17C16.4477 1 16 1.44772 16 2C16 2.55228 16.4477 3 17 3H19.5858L3 19.5858V17C3 16.4477 2.55228 16 2 16C1.44772 16 1 16.4477 1 17V21C1 22.1046 1.89543 23 3 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H4.41421L21 4.41421V7Z" fill="#0F0F0F"></path> </g></svg>`,
  },
  {
    name: "path",
    title: "선 잇기",
    icon: '<svg id="svg8" viewBox="28 55 140 140"><path d="m 28.386086,150.01543 v 43.10301 H 71.489092 V 178.7505 H 120.75466 V 164.38283 H 71.355237 L 71.488872,150.0086 H 57.121421 c 0,-49.247 14.367449,-63.614929 63.633239,-63.614929 v -14.36768 c -63.633239,0 -78.000906,28.735609 -78.000906,77.982609 l -14.367888,0.007 z m 14.367669,28.73507 v -14.36767 h 14.367668 v 14.36767 z" id="path840" style="stroke-width: 0.264583;"></path><path d="m 120.74975,150.00843 v 43.10301 h 43.10301 V 150.0016 l -43.10301,0.007 z m 14.36767,28.73507 v -14.36767 h 14.36767 v 14.36767 z" id="path840-1" style="stroke-width: 0.264583;"></path><path d="m 120.74975,57.658601 v 43.103009 h 43.10301 V 57.651771 l -43.10301,0.007 z m 14.36767,28.73507 v -14.36767 h 14.36767 v 14.36767 z" id="path840-1-0" style="stroke-width: 0.264583;"></path></svg>',
  },
  {
    name: "weatherFront",
    title: "전선 그리기",
    icon: '<svg fill="#000000" width="256px" height="256px" viewBox="6 6 20 20" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="0.00032" transform="matrix(1, 0, 0, 1, 0, 0)rotate(0)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <defs> <style> .cls-1 { fill: none; } </style> </defs> <path d="M28.1655,2a13.0289,13.0289,0,0,0-12.542,9.5791l-1.1767,4.3154A11.0237,11.0237,0,0,1,3.8345,24H2v2H3.8345a12.9139,12.9139,0,0,0,3.4687-.4819,3.9979,3.9979,0,1,0,6.5818-4.2866,12.9671,12.9671,0,0,0,1.6209-2.5269,3.9944,3.9944,0,1,0,2.3772-7.5991,10.95,10.95,0,0,1,1.7253-3.01,3.9825,3.9825,0,0,0,6.9058-3.9648A10.9435,10.9435,0,0,1,28.1655,4H30V2ZM11,26a1.9983,1.9983,0,0,1-1.8118-1.1655,13.0811,13.0811,0,0,0,3.2969-2.1426A1.9773,1.9773,0,0,1,11,26Zm8-11a1.9926,1.9926,0,0,1-2.759,1.8467c.0442-.1426.0959-.2813.1355-.4258L17.301,13.03A1.9976,1.9976,0,0,1,19,15Zm6-9a1.9942,1.9942,0,0,1-3.9011.5894,11.0511,11.0511,0,0,1,3.3623-1.9385A1.995,1.995,0,0,1,25,6Z" transform="translate(0 0)"></path> <polygon points="10 4 10 8.586 3.414 2 2 3.414 8.586 10 4 10 4 12 12 12 12 4 10 4"></polygon> <rect id="_Transparent_Rectangle_" data-name="<Transparent Rectangle>" class="cls-1" width="32" height="32"></rect> </g></svg>',
  },
  {
    name: "textbox",
    title: "글 상자",
    icon: `<svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><path d="M497,90c8.291,0,15-6.709,15-15V15c0-8.291-6.709-15-15-15h-60c-8.291,0-15,6.709-15,15v15H90V15c0-8.401-6.599-15-15-15 H15C6.599,0,0,6.599,0,15v60c0,8.399,6.599,15,15,15h15v332H15c-8.291,0-15,6.709-15,15v60c0,8.291,6.709,15,15,15h60 c8.291,0,15-6.709,15-15v-15h332v15c0,8.399,6.599,15,15,15h60c8.401,0,15-6.601,15-15v-60c0-8.401-6.599-15-15-15h-15V90H497z  M452,422h-15c-8.401,0-15,6.599-15,15v15H90v-15c0-8.291-6.709-15-15-15H60V90h15c8.401,0,15-6.601,15-15V60h332v15 c0,8.291,6.709,15,15,15h15V422z"></path></g></g><g><g><path d="M361,105H151c-8.291,0-15,6.709-15,15v60c0,6.064,3.647,11.543,9.258,13.857c5.625,2.329,12.056,1.04,16.348-3.252 L187.211,165H226v176.459l-27.48,42.221c-3.062,4.6-3.354,10.518-0.747,15.396S205.463,407,211,407h90 c5.537,0,10.62-3.047,13.228-7.925c2.608-4.878,2.314-10.796-0.747-15.396L286,341.459V165h38.789l25.605,25.605 c4.307,4.307,10.781,5.596,16.348,3.252c5.61-2.314,9.258-7.793,9.258-13.857v-60C376,111.709,369.291,105,361,105z"></path></g></g></svg>`,
  },
  {
    name: "images",
    title: "이미지",
    icon: `<svg viewBox="0 0 576 512"><path d="M160 32c-35.3 0-64 28.7-64 64l0 224c0 35.3 28.7 64 64 64l352 0c35.3 0 64-28.7 64-64l0-224c0-35.3-28.7-64-64-64L160 32zM396 138.7l96 144c4.9 7.4 5.4 16.8 1.2 24.6S480.9 320 472 320l-144 0-48 0-80 0c-9.2 0-17.6-5.3-21.6-13.6s-2.9-18.2 2.9-25.4l64-80c4.6-5.7 11.4-9 18.7-9s14.2 3.3 18.7 9l17.3 21.6 56-84C360.5 132 368 128 376 128s15.5 4 20 10.7zM192 128a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM48 120c0-13.3-10.7-24-24-24S0 106.7 0 120L0 344c0 75.1 60.9 136 136 136l320 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-320 0c-48.6 0-88-39.4-88-88l0-224z"/></svg>`,
  },
  {
    name: "templates",
    title: "템플릿",
    icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.675 3h.825v18h-2.175c-3.59 0-5.385 0-6.61-.966a4.497 4.497 0 0 1-.749-.748C3 18.06 3 16.266 3 12.675v-1.35c0-3.59 0-5.385.966-6.61a4.5 4.5 0 0 1 .748-.749C5.94 3 7.734 3 11.325 3h1.35Zm6.61 17.034c-.926.73-2.178.909-4.285.952v-9.968h6v1.657c0 3.59 0 5.386-.966 6.61-.22.279-.47.53-.748.749Zm1.709-10.516H15V3.014c2.107.044 3.36.222 4.286.952.278.22.529.47.748.748.788 1 .933 2.38.96 4.804Z" fill="currentColor"></path></svg>`,
  },
  {
    name: "background",
    title: "캔버스 설정",
    icon: `<svg height="512" viewBox="0 0 512 512" width="512"><path d="m499.95 197.7-39.35-8.55c-3.42-10.48-7.66-20.7-12.66-30.54l21.79-33.89c3.89-6.05 3.04-14-2.05-19.09l-61.3-61.3c-5.09-5.09-13.04-5.94-19.09-2.05l-33.89 21.79c-9.84-5-20.06-9.24-30.54-12.66l-8.55-39.35c-1.53-7.03-7.75-12.05-14.95-12.05h-86.7c-7.2 0-13.42 5.02-14.95 12.05l-8.55 39.35c-10.48 3.42-20.7 7.66-30.54 12.66l-33.89-21.79c-6.05-3.89-14-3.04-19.09 2.05l-61.3 61.3c-5.09 5.09-5.94 13.04-2.05 19.09l21.79 33.89c-5 9.84-9.24 20.06-12.66 30.54l-39.35 8.55c-7.03 1.53-12.05 7.75-12.05 14.95v86.7c0 7.2 5.02 13.42 12.05 14.95l39.35 8.55c3.42 10.48 7.66 20.7 12.66 30.54l-21.79 33.89c-3.89 6.05-3.04 14 2.05 19.09l61.3 61.3c5.09 5.09 13.04 5.94 19.09 2.05l33.89-21.79c9.84 5 20.06 9.24 30.54 12.66l8.55 39.35c1.53 7.03 7.75 12.05 14.95 12.05h86.7c7.2 0 13.42-5.02 14.95-12.05l8.55-39.35c10.48-3.42 20.7-7.66 30.54-12.66l33.89 21.79c6.05 3.89 14 3.04 19.09-2.05l61.3-61.3c5.09-5.09 5.94-13.04 2.05-19.09l-21.79-33.89c5-9.84 9.24-20.06 12.66-30.54l39.35-8.55c7.03-1.53 12.05-7.75 12.05-14.95v-86.7c0-7.2-5.02-13.42-12.05-14.95zm-152.16 58.3c0 50.61-41.18 91.79-91.79 91.79s-91.79-41.18-91.79-91.79 41.18-91.79 91.79-91.79 91.79 41.18 91.79 91.79z"/></svg>`,
  },
  {
    name: "test",
    title: "실험실",
    icon: `<svg viewBox="0 0 24 24" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><defs><style>.cls-1{fill:none;stroke:#020202;stroke-miterlimit:10;stroke-width:1.91px;}</style></defs><line class="cls-1" x1="7.23" y1="1.5" x2="16.77" y2="1.5"></line><circle class="cls-1" cx="12" cy="14.86" r="2.86"></circle><line class="cls-1" x1="7.87" y1="17.25" x2="9.52" y2="16.3"></line><line class="cls-1" x1="16.13" y1="12.48" x2="14.48" y2="13.43"></line><line class="cls-1" x1="16.13" y1="17.25" x2="14.48" y2="16.3"></line><line class="cls-1" x1="7.87" y1="12.48" x2="9.52" y2="13.43"></line><line class="cls-1" x1="12" y1="10.09" x2="12" y2="12"></line><line class="cls-1" x1="12" y1="19.64" x2="12" y2="17.73"></line><path class="cls-1" d="M19.64,14.86a7.63,7.63,0,0,0-4.78-7.07V1.5H9.14V7.79a7.63,7.63,0,0,0,2.18,14.68c.22,0,.45,0,.68,0s.46,0,.68,0A7.65,7.65,0,0,0,19.64,14.86Z"></path></g></svg>`,
  },
  /* 기능 구현 완료가 되면 적용 시킬 목록
  {
    name: "cut",
    title: "자르기",
    icon: `<svg viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>cut#4 [#821]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-420.000000, -4519.000000)" fill="#000000"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M378,4379 L380,4379 L380,4376 L378,4376 L378,4379 Z M380,4373 L378,4373 L370,4373 L370,4366 L368,4366 L368,4373 L368,4375 L370,4375 L378,4375 L380,4375 L384,4375 L384,4373 L380,4373 Z M370,4365 L378,4365 L378,4372 L380,4372 L380,4365 L380,4363 L378,4363 L370,4363 L368,4363 L364,4363 L364,4365 L368,4365 L370,4365 Z M368,4362 L370,4362 L370,4359 L368,4359 L368,4362 Z" id="cut#4-[#821]"> </path> </g> </g> </g> </g></svg>`,
  },
  {
    name: "colorFilter",
    title: "색상 영역 선택",
    icon: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="m 12.957031 0.980469 c -0.519531 0.015625 -1.015625 0.234375 -1.375 0.605469 l -1.585937 1.585937 l -1.085938 -1.085937 c -0.097656 -0.09375 -0.226562 -0.148438 -0.363281 -0.148438 c -0.128906 0.003906 -0.253906 0.054688 -0.34375 0.148438 l -2.121094 2.121093 c -0.195312 0.195313 -0.195312 0.511719 0 0.707031 l 0.644531 0.648438 l -5.585937 5.582031 c -0.09375 0.097657 -0.144531 0.222657 -0.144531 0.355469 v 1.792969 l -0.855469 0.851562 c -0.1953125 0.195313 -0.1953125 0.515625 0 0.710938 l 1 1 c 0.195313 0.191406 0.511719 0.191406 0.707031 0 l 0.855469 -0.855469 h 1.792969 c 0.132812 0 0.257812 -0.050781 0.351562 -0.144531 l 5.585938 -5.585938 l 0.648437 0.644531 c 0.195313 0.195313 0.511719 0.195313 0.707031 0 l 2.121094 -2.121093 c 0.195313 -0.195313 0.195313 -0.511719 0 -0.707031 l -1.085937 -1.085938 l 1.585937 -1.585938 c 1.304688 -1.273437 0.367188 -3.488281 -1.453125 -3.433593 z m -5.023437 5.789062 l 1.292968 1.292969 l -2.9375 2.9375 h -2.585937 z m 0 0" fill="#2e3436" fill-rule="evenodd"></path> </g></svg>`,
  },
  {
    name: "weatherData",
    title: "기상자료",
    icon: `<svg viewBox="0 0 16 16"><path d="m6.5 1c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h1c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5zm-3.74 1.55c-.13 0-.25.05-.35.15l-.71.71c-.2.2-.2.51 0 .71l.71.71c.2.2.51.2.71 0l.71-.71c.2-.2.2-.51 0-.71l-.71-.71c-.1-.1-.23-.15-.36-.15zm8.48 0c-.13 0-.25.05-.35.15l-.71.71c-.2.2-.2.51 0 .71l.71.71c.2.2.51.2.71 0l.71-.71c.2-.2.2-.51 0-.71l-.71-.71c-.1-.1-.23-.15-.36-.15zm-4.25 1.46c-2.2 0-4 1.81-4 4 0 1.39.72 2.61 1.8 3.33.32-.14.66-.23 1.02-.25.61-1.79 2.24-3.08 4.19-3.08.34 0 .67.05.98.13v-.13c0-2.19-1.8-4-4-4zm-6.49 3c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h1c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5zm12 0c-.28 0-.5.22-.5.5v1c0 .02 0 .04.01.05.22.13.43.28.63.45h.86c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5zm-2.5 2c-1.77 0-3.25 1.32-3.47 3.07-.17-.05-.35-.07-.53-.07-1.1 0-2 .9-2 2s.9 2 2 2h7.5c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5c-.11 0-.22 0-.33.02-.57-1.23-1.81-2.02-3.17-2.02zm-7.24 2.04c-.13 0-.25.05-.35.15l-.71.71c-.2.2-.2.51 0 .71l.71.71c.18.19.48.2.68.02.13-.53.41-1 .79-1.37l-.05-.06-.71-.71c-.1-.1-.23-.15-.36-.15z"/></svg>`,
  },
  */
];

const defaultExtendedButtons = [
  {
    name: "help",
    title: "도움말",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M80 160c0-35.3 28.7-64 64-64l32 0c35.3 0 64 28.7 64 64l0 3.6c0 21.8-11.1 42.1-29.4 53.8l-42.2 27.1c-25.2 16.2-40.4 44.1-40.4 74l0 1.4c0 17.7 14.3 32 32 32s32-14.3 32-32l0-1.4c0-8.2 4.2-15.8 11-20.2l42.2-27.1c36.6-23.6 58.8-64.1 58.8-107.7l0-3.6c0-70.7-57.3-128-128-128l-32 0C73.3 32 16 89.3 16 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm80 320a40 40 0 1 0 0-80 40 40 0 1 0 0 80z"/></svg>`,
  },
  {
    name: "undo",
    title: "실행취소",
    icon: `<svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512.011 512.011" xml:space="preserve"><path d="M511.136,286.255C502.08,194.863,419.84,128.015,328,128.015H192v-80c0-6.144-3.52-11.744-9.056-14.432 c-5.568-2.656-12.128-1.952-16.928,1.92l-160,128C2.208,166.575,0,171.151,0,176.015s2.208,9.44,5.984,12.512l160,128 c2.912,2.304,6.464,3.488,10.016,3.488c2.368,0,4.736-0.512,6.944-1.568c5.536-2.688,9.056-8.288,9.056-14.432v-80h139.392 c41.856,0,80,30.08,84.192,71.712c4.832,47.872-32.704,88.288-79.584,88.288H208c-8.832,0-16,7.168-16,16v64 c0,8.832,7.168,16,16,16h128C438.816,480.015,521.472,391.151,511.136,286.255z"></path></svg>`,
  },
  {
    name: "redo",
    title: "재실행",
    icon: `<svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512.011 512.011" xml:space="preserve" style="transform: scale(-1, 1);"><path d="M511.136,286.255C502.08,194.863,419.84,128.015,328,128.015H192v-80c0-6.144-3.52-11.744-9.056-14.432             c-5.568-2.656-12.128-1.952-16.928,1.92l-160,128C2.208,166.575,0,171.151,0,176.015s2.208,9.44,5.984,12.512l160,128             c2.912,2.304,6.464,3.488,10.016,3.488c2.368,0,4.736-0.512,6.944-1.568c5.536-2.688,9.056-8.288,9.056-14.432v-80h139.392             c41.856,0,80,30.08,84.192,71.712c4.832,47.872-32.704,88.288-79.584,88.288H208c-8.832,0-16,7.168-16,16v64             c0,8.832,7.168,16,16,16h128C438.816,480.015,521.472,391.151,511.136,286.255z"></path></svg>`,
  },
  {
    name: "clear",
    title: "초기화",
    icon: `<svg fill="#000000" viewBox="-115.2 -115.2 2150.40 1950.40" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="115.2"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M960 0v213.333c411.627 0 746.667 334.934 746.667 746.667S1371.627 1706.667 960 1706.667 213.333 1371.733 213.333 960c0-197.013 78.4-382.507 213.334-520.747v254.08H640V106.667H53.333V320h191.04C88.64 494.08 0 720.96 0 960c0 529.28 430.613 960 960 960s960-430.72 960-960S1489.387 0 960 0" fill-rule="evenodd"></path> </g></svg>`,
  },
  {
    name: "download",
    title: "내려받기",
    icon: `<svg fill="#000000" width="256px" height="256px" viewBox="3 3 18 18" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="0.4800000000000001"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M20,8.94a1.31,1.31,0,0,0-.06-.27l0-.09a1.07,1.07,0,0,0-.19-.28h0l-6-6h0a1.07,1.07,0,0,0-.28-.19l-.1,0A1.1,1.1,0,0,0,13.06,2H7A3,3,0,0,0,4,5V19a3,3,0,0,0,3,3H17a3,3,0,0,0,3-3V9S20,9,20,8.94ZM14,5.41,16.59,8H15a1,1,0,0,1-1-1ZM18,19a1,1,0,0,1-1,1H7a1,1,0,0,1-1-1V5A1,1,0,0,1,7,4h5V7a3,3,0,0,0,3,3h3Zm-4.71-4.71-.29.3V12a1,1,0,0,0-2,0v2.59l-.29-.3a1,1,0,0,0-1.42,1.42l2,2a1,1,0,0,0,.33.21.94.94,0,0,0,.76,0,1,1,0,0,0,.33-.21l2-2a1,1,0,0,0-1.42-1.42Z"></path></g></svg>`,
  },
  {
    name: "export",
    title: "DB저장",
    icon: `<svg viewBox="0 0 35 35" stroke="#000000" stroke-width="3.5"><path d="M17.5,23.1a1.25,1.25,0,0,1-1.25-1.25V3.154a1.25,1.25,0,0,1,2.5,0V21.848A1.25,1.25,0,0,1,17.5,23.1Z"></path><path d="M9.371,11.163a1.251,1.251,0,0,1-.884-2.134l6.751-6.751a3.2,3.2,0,0,1,4.524,0l6.752,6.751A1.25,1.25,0,0,1,24.746,10.8L18,4.046a.7.7,0,0,0-.99,0L10.254,10.8A1.243,1.243,0,0,1,9.371,11.163Z"></path><path d="M31.436,34.466H3.564A3.317,3.317,0,0,1,.25,31.153V22.415a1.25,1.25,0,0,1,2.5,0v8.738a.815.815,0,0,0,.814.813H31.436a.815.815,0,0,0,.814-.813V22.415a1.25,1.25,0,0,1,2.5,0v8.738A3.317,3.317,0,0,1,31.436,34.466Z"></path></svg>`,
  },
  {
    name: "import",
    title: "불러오기",
    icon: `<svg viewBox="0 0 35 35" stroke="#000000" stroke-width="3.5"><path d="M17.5,22.131a1.249,1.249,0,0,1-1.25-1.25V2.187a1.25,1.25,0,0,1,2.5,0V20.881A1.25,1.25,0,0,1,17.5,22.131Z"></path><path d="M17.5,22.693a3.189,3.189,0,0,1-2.262-.936L8.487,15.006a1.249,1.249,0,0,1,1.767-1.767l6.751,6.751a.7.7,0,0,0,.99,0l6.751-6.751a1.25,1.25,0,0,1,1.768,1.767l-6.752,6.751A3.191,3.191,0,0,1,17.5,22.693Z"></path><path d="M31.436,34.063H3.564A3.318,3.318,0,0,1,.25,30.749V22.011a1.25,1.25,0,0,1,2.5,0v8.738a.815.815,0,0,0,.814.814H31.436a.815.815,0,0,0,.814-.814V22.011a1.25,1.25,0,1,1,2.5,0v8.738A3.318,3.318,0,0,1,31.436,34.063Z"></path></svg>`,
  },
  {
    name: "fullscreen",
    title: "전체화면",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32s32-14.3 32-32V96h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H64V352zM320 32c-17.7 0-32 14.3-32 32s14.3 32 32 32h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V64c0-17.7-14.3-32-32-32H320zM448 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32V352z"/></svg>`,
  },
];

function toolbar() {
  const _self = this;
  let buttons = [];
  let extendedButtons = [];

  if (Array.isArray(this.buttons) && this.buttons.length) {
    buttons = defaultButtons.filter((item) => this.buttons.includes(item.name));
    extendedButtons = defaultExtendedButtons.filter((item) =>
      this.buttons.includes(item.name)
    );
  } else {
    buttons = defaultButtons;
    extendedButtons = defaultExtendedButtons;
  }

  try {
    const container = document.querySelector(this.containerSelector);
    container.insertAdjacentHTML(
      "beforeend",
      `
            <div class="toolbar" id="toolbar">
                <div class="main-buttons"></div>
                <div class="extended-buttons"></div>
            </div>
        `
    );

    const mainButtonsContainer = container.querySelector(
      "#toolbar .main-buttons"
    );
    buttons.forEach((item) => {
      const button = document.createElement("button");
      button.id = item.name;
      button.innerHTML = item.icon;
      button.addEventListener("click", function () {
        document
          .querySelectorAll(`${_self.containerSelector} #toolbar button`)
          .forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        _self.setActiveTool(button.id);
      });
      button.addEventListener("mouseenter", function () {
        showTooltip(button, item);
      });

      button.addEventListener("mouseleave", function () {
        removeTooltip();
      });
      mainButtonsContainer.appendChild(button);
    });

    const extendedButtonsContainer = container.querySelector(
      "#toolbar .extended-buttons"
    );
    extendedButtons.forEach((item) => {
      const button = document.createElement("button");
      button.id = item.name;
      button.innerHTML = item.icon;
      button.addEventListener("click", async function () {
        const id = this.id;
        if (id === "import") {
          openEditRepository();
        } else if (id === "export") {
          if (window.confirm("현재 캔버스를 저장하시겠습니까?.")) {
            const canvasJsonData = canvasToJsonData(_self.canvas);
            canvasJsonData.objects = canvasJsonData.objects.filter(
              (obj) => !obj.isControlPoint
            );
            canvasJsonData.viewportTransform = _self.canvas.viewportTransform;
            await upload(canvasJsonData);
          }
        } else if (id === "clear") {
          if (window.confirm("현재 캔버스를 초기화하시겠습니까?")) {
            _self.canvas.clear();
            _self.history.clear();
            remove("canvasEditor");
          }
        } else if (id === "download") {
          document.body.insertAdjacentHTML(
            "beforeend",
            `
              <div class="custom-modal-container">
                <div class="custom-modal-content download-modal-content">
                  <div class="button-download" id="svg">SVG 다운로드</div>
                  <div class="button-download" id="png">PNG 다운로드</div>
                  <div class="button-download" id="jpg">JPG 다운로드</div>
                </div>
              </div>
            `
          );
          setTimeout(() => {
            document
              .querySelector(".custom-modal-container")
              .classList.add("active");
          }, 10);

          document
            .querySelector(".custom-modal-container")
            .addEventListener("click", function () {
              this.remove();
            });

          document
            .querySelectorAll(".custom-modal-container .button-download")
            .forEach((button) => {
              button.addEventListener("click", async function () {
                let type = this.id;
                if (type === "svg") downloadSVG(_self.canvas.toSVG());
                else if (type === "png")
                  downloadImage(await _self.canvas.toDataURL());
                else if (type === "jpg")
                  downloadImage(
                    _self.canvas.toDataURL({ format: "jpeg" }),
                    "jpg",
                    "image/jpeg"
                  );
              });
            });
        } else if (id === "undo") {
          _self.undo();
        } else if (id === "redo") {
          _self.redo();
        }
      });
      button.addEventListener("mouseenter", function () {
        showTooltip(button, item);
      });

      button.addEventListener("mouseleave", function () {
        removeTooltip();
      });
      extendedButtonsContainer.appendChild(button);
    });
  } catch (error) {
    console.error("Can't create toolbar", error);
  }
}

function showTooltip(button, item) {
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.innerText = item.title;

  document.body.appendChild(tooltip);

  const buttonRect = button.getBoundingClientRect();

  let tooltipLeft =
    buttonRect.left + buttonRect.width / 2 - tooltip.offsetWidth / 2;
  let tooltipRight =
    buttonRect.right + buttonRect.width / 2 - tooltip.offsetWidth / 2;
  let tooltipTop = buttonRect.top + buttonRect.height + 5;

  const screenWidth = window.innerWidth;
  if (tooltipLeft < 0) {
    tooltipLeft = 0;
  } else if (tooltipRight + tooltip.offsetWidth > screenWidth) {
    tooltipLeft = screenWidth - tooltip.offsetWidth;
  }

  tooltip.style.left = `${tooltipLeft}px`;
  tooltip.style.top = `${tooltipTop}px`;

  setTimeout(() => {
    tooltip.style.opacity = "1";
    tooltip.style.transform = "translateY(0)";
  }, 10);
}

function removeTooltip() {
  const tooltip = document.querySelector(".tooltip");
  if (tooltip) {
    tooltip.remove();
  }
}

export { toolbar, removeTooltip };
