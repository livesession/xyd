import {LitElement, html, css} from 'lit';
import {property, state} from 'lit/decorators.js';
import {unsafeCSS} from 'lit';

import styles from './LitCounter.style.css?raw';

export class LitCounter extends LitElement {
    static styles = css`${unsafeCSS(styles)}`;

    @property({type: Number})
    declare start: number;

    @state()
    declare _count: number;

    constructor() {
        super();
        this.start = 0;
        this._count = 0;
    }

    private increment() {
        this._count++;
    }

    private decrement() {
        this._count--;
    }

    render() {
        return html`
            <body>
            <div class="relative border-r border-b border-[#EBEAEA] bg-bunker-50 bg-[linear-gradient(to_right,#EBEAEA_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB_1px,transparent_1px)] bg-[size:16px_16px] bg flex flex-col items-start my-12 sm:my-40">
                <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center lg:h-96 px-0 md:pl-12 md:pr-16 md:pb-8 pt-8">
                    <div class="flex flex-col items-start justify-between h-full pb-6 px-4 w-full lg:w-2/5">
                        <div class="hidden md:block flex-grow md:pt-6 md:scale-100"><span
                                style="box-sizing: border-box; display: inline-block; overflow: hidden; width: initial; height: initial; background: none; opacity: 1; border: 0px; margin: 0px; padding: 0px; position: relative; max-width: 100%;"><span
                                style="box-sizing: border-box; display: block; width: initial; height: initial; background: none; opacity: 1; border: 0px; margin: 0px; padding: 0px; max-width: 100%;"><img
                                alt="" aria-hidden="true"
                                src="data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27321%27%20height=%2785%27/%3e"
                                style="display: block; max-width: 100%; width: initial; height: initial; background: none; opacity: 1; border: 0px; margin: 0px; padding: 0px;"></span><img
                                alt="Hugging Face Logo"
                                src="https://infisical.com/_next/image?url=%2Fimages%2Fcustomers%2Fhugging-face%2Flogo.png&amp;w=750&amp;q=75"
                                decoding="async" data-nimg="intrinsic"
                                style="position: absolute; inset: 0px; box-sizing: border-box; padding: 0px; border: none; margin: auto; display: block; width: 0px; height: 0px; min-width: 100%; max-width: 100%; min-height: 100%; max-height: 100%;"
                                srcset="https://infisical.com/_next/image?url=%2Fimages%2Fcustomers%2Fhugging-face%2Flogo.png&amp;w=384&amp;q=75  1x,https://infisical.com/_next/image?url=%2Fimages%2Fcustomers%2Fhugging-face%2Flogo.png&amp;w=750&amp;q=75  2x"></span>
                        </div>
                        <div class="block md:hidden md:pt-6 md:scale-100"><span
                                style="box-sizing: border-box; display: inline-block; overflow: hidden; width: initial; height: initial; background: none; opacity: 1; border: 0px; margin: 0px; padding: 0px; position: relative; max-width: 100%;"><span
                                style="box-sizing: border-box; display: block; width: initial; height: initial; background: none; opacity: 1; border: 0px; margin: 0px; padding: 0px; max-width: 100%;"><img
                                alt="" aria-hidden="true"
                                src="data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27240%27%20height=%2762%27/%3e"
                                style="display: block; max-width: 100%; width: initial; height: initial; background: none; opacity: 1; border: 0px; margin: 0px; padding: 0px;"></span><img
                                alt="Hugging Face Logo"
                                src="https://infisical.com/_next/image?url=%2Fimages%2Fcustomers%2Fhugging-face%2Flogo.png&amp;w=640&amp;q=75"
                                decoding="async" data-nimg="intrinsic"
                                srcset="https://infisical.com/_next/image?url=%2Fimages%2Fcustomers%2Fhugging-face%2Flogo.png&amp;w=256&amp;q=75  1x,https://infisical.com/_next/image?url=%2Fimages%2Fcustomers%2Fhugging-face%2Flogo.png&amp;w=640&amp;q=75  2x"
                                style="position: absolute; inset: 0px; box-sizing: border-box; padding: 0px; border: none; margin: auto; display: block; width: 0px; height: 0px; min-width: 100%; max-width: 100%; min-height: 100%; max-height: 100%;"></span>
                        </div>
                        <div class="text-3xl md:text-4xl xl:text-5xl leading-10 md:leading-12 xl:leading-14 pt-6 pl-3 pr-10">
                            Securing the future of AI with <b>Infisical</b></div>
                    </div>
                    <div class="pt-4 lg:pt-8 p-6 flex flex-col items-start lg:w-7/12"><a target="_blank"
                                                                                         rel="noopener noreferrer"
                                                                                         href="https://infisical.com/customers/hugging-face"
                                                                                         class="hidden lg:block group mb-1">
                        <div class="relative text-center px-1 text-mineshaft-500 cursor-pointer w-max -left-1 flex flex-row items-center mb-4">
                            <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="book"
                                 class="svg-inline--fa fa-book text-sm group-hover:text-black" role="img"
                                 xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                <path fill="currentColor"
                                      d="M0 88C0 39.4 39.4 0 88 0H392c30.9 0 56 25.1 56 56V344c0 22.3-13.1 41.6-32 50.6V464h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H80c-44.2 0-80-35.8-80-80c0-2.7 .1-5.4 .4-8H0V88zM80 400c-17.7 0-32 14.3-32 32s14.3 32 32 32H368V400H80zM48 358.7c9.8-4.3 20.6-6.7 32-6.7H392c4.4 0 8-3.6 8-8V56c0-4.4-3.6-8-8-8H88C65.9 48 48 65.9 48 88V358.7zM152 112H328c13.3 0 24 10.7 24 24s-10.7 24-24 24H152c-13.3 0-24-10.7-24-24s10.7-24 24-24zm0 80H328c13.3 0 24 10.7 24 24s-10.7 24-24 24H152c-13.3 0-24-10.7-24-24s10.7-24 24-24z"></path>
                            </svg>
                            <div class="relative z-10 inline group-hover:font-bold group-hover:text-black duration-100 pl-2">
                                Read Customer Story
                            </div>
                            <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="arrow-up-right"
                                 class="svg-inline--fa fa-arrow-up-right pl-2 z-10 group-hover:text-black" role="img"
                                 xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                                <path fill="currentColor"
                                      d="M328 96c13.3 0 24 10.7 24 24V360c0 13.3-10.7 24-24 24s-24-10.7-24-24V177.9L73 409c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l231-231H88c-13.3 0-24-10.7-24-24s10.7-24 24-24H328z"></path>
                            </svg>
                        </div>
                    </a><span class="font-medium text-lg md:text-xl 2xl:text-2xl">"Infisical provided all the functionality and security settings we needed to boost our security posture and save engineering time. Whether you're working locally, running kubernetes clusters in production, or operating secrets within CI/CD pipelines, Infisical has a seamless prebuilt workflow."</span><span
                            class="text-mineshaft-500 text-md md:text-lg mt-2 md:mt-6">Adrien Carreira, Head of Infrastructure, Hugging Face</span><a
                            target="_blank" rel="noopener noreferrer"
                            href="https://infisical.com/customers/hugging-face" class="block lg:hidden mt-8 group mb-1">
                        <div class="relative text-center px-1 text-mineshaft-500 cursor-pointer w-max -left-1 flex flex-row items-center pb-4">
                            <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="book"
                                 class="svg-inline--fa fa-book text-sm group-hover:text-black" role="img"
                                 xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                <path fill="currentColor"
                                      d="M0 88C0 39.4 39.4 0 88 0H392c30.9 0 56 25.1 56 56V344c0 22.3-13.1 41.6-32 50.6V464h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H80c-44.2 0-80-35.8-80-80c0-2.7 .1-5.4 .4-8H0V88zM80 400c-17.7 0-32 14.3-32 32s14.3 32 32 32H368V400H80zM48 358.7c9.8-4.3 20.6-6.7 32-6.7H392c4.4 0 8-3.6 8-8V56c0-4.4-3.6-8-8-8H88C65.9 48 48 65.9 48 88V358.7zM152 112H328c13.3 0 24 10.7 24 24s-10.7 24-24 24H152c-13.3 0-24-10.7-24-24s10.7-24 24-24zm0 80H328c13.3 0 24 10.7 24 24s-10.7 24-24 24H152c-13.3 0-24-10.7-24-24s10.7-24 24-24z"></path>
                            </svg>
                            <div class="relative text-center inline px-1.5 ml-1">
                                <div class="relative z-10 inline group-hover:font-medium group-hover:text-black">Read
                                    Customer Story
                                </div>
                                <div class="absolute bottom-0 left-0 w-full bg-primary mb-0.5 h-2/5 opacity-0 group-hover:opacity-100 duration-100"></div>
                            </div>
                            <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="arrow-up-right"
                                 class="svg-inline--fa fa-arrow-up-right pl-1 z-10 group-hover:text-black" role="img"
                                 xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                                <path fill="currentColor"
                                      d="M328 96c13.3 0 24 10.7 24 24V360c0 13.3-10.7 24-24 24s-24-10.7-24-24V177.9L73 409c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l231-231H88c-13.3 0-24-10.7-24-24s10.7-24 24-24H328z"></path>
                            </svg>
                        </div>
                    </a></div>
                </div>
            </div>
            </body>
        `;
    }
}

customElements.define('lit-counter', LitCounter); 