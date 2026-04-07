// ==UserScript==
// @name         BlueSky Copy Post URL Button 3
// @namespace    http://tampermonkey.net/
// @version      3.x
// @description  We are copying anything ewe see. god dang. based on the twitter version by  dinomcworld
// @author       brideer
// @match        https://bsky.app/*
// @grant        GM_setClipboard
// @run-at       document-end
// ==/UserScript==

(function () {
        'use strict';
        const baseUrl = 'https://fxbsky.app'; // change this to use a different redirect - e.g. bsky.app for default, bsyy.app, and more.

        // these two are svg icons for the button states! They're pretty :)
        const defaultSVG = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-clipboard" viewBox="0 0 24 24" stroke-width="2" stroke="#71767C" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" /><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /></svg>';
        const copiedSVG = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-clipboard-check" viewBox="0 0 24 24" stroke-width="2" stroke="#00abfb" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" /><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M9 14l2 2l4 -4" /></svg>';

        function bskyCopyButton() {
                const posts = document.querySelectorAll('button[data-testid="postBookmarkBtn"]')

                posts.forEach(likeButton => { // checks if button already exists
                        const parentDiv = likeButton.parentElement;
                        const post = parentDiv.closest(
                                'div[data-testid^="feedItem"], div[data-testid^="postThreadItem"]' // each post data-testid has a user-account suffix. this just matches for the beginning template.
                        ); 
                        if (post && !post.querySelector('.custom-copy-icon')) { // this section defines and sets up the button we're putting in the bottom bar.
                                const copyIcon = document.createElement('div'); 
                                copyIcon.classList.add('custom-copy-icon');
                                copyIcon.setAttribute('aria-label', 'Copy link');
                                copyIcon.setAttribute('role', 'button');
                                copyIcon.setAttribute('tabindex', '0');
                                copyIcon.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 19px; height: 19px; border-radius: 9999px; transition-duration: 0.2s; cursor: pointer;';
                                copyIcon.innerHTML = defaultSVG;

                                copyIcon.addEventListener('click', (event) => { // this section makes it go do business on click :)
                                        event.stopPropagation();
                                        const postUrl = extractPostUrl(post);
                                        if (postUrl) {
                                                navigator.clipboard.writeText(postUrl)
                                                        .then(() => {
                                                                console.log('Post URL copied to clipboard!');
                                                                copyIcon.innerHTML = copiedSVG;
                                                        })
                                                        .catch(err => console.error('Failed to copy post URL: ', err));
                                        }
                                });

                                const parentDivClone = parentDiv.cloneNode(true); // honestly don't remember what this is all about. I havent needed to mess with this as far as I know.
                                parentDivClone.style.cssText = 'display: flex; align-items: center;';
                                parentDiv.parentNode.insertBefore(parentDivClone, parentDiv.nextSibling);
                                parentDivClone.innerHTML = '';
                                parentDivClone.appendChild(copyIcon);
                        }
                });
        }


        function extractPostUrl(postElement) {
                // twitter has a time element which makes it easy to get the post url in any format
                // bluesky does not, so: if a post contains a follow button, we are in thread view (viewing a single post in thread)
                // and that means, the url of the top post is just the current url since we cannot get it otherwise.

                // ~~~~Overall, this function:~~~~
                // 1. Checks if we are in thread view
                // 2. If we are, checks if the post we are grabbing the link for is the top post
                // 3. If we are BOTH thread view, and grabbing top post, grabs from address bar.
                // 4. Else, uses other routes to get the post url from hrefs in the html.
                const linkElement = postElement.querySelector('a[href*="/post/"] > span');
                const followBtn = postElement.querySelector('button[data-testid="followBtn"]');
                const dataTestThread = postElement.getAttribute('data-testid');
                const containBtn = postElement.contains(followBtn);
                const isThreadView =
                        dataTestThread && dataTestThread.match(/^postThreadItem/) &&
                        postElement.contains(followBtn);

                //        console.log('containBtn:', containBtn);               // ~ these are for debugging! I had a lot of trouble realizing the issue with dataTestThread.
                //        console.log('linkElement:', linkElement);
                //        console.log('dataTestThread:', dataTestThread);
                //        console.log('followBtn:', followBtn);
                //        console.log('isThreadView:', isThreadView);

                        if (isThreadView) {
                                return baseUrl + window.location.pathname; // window.location.pathname is considered best here due to compatibility.
                        } else
                        
                if (linkElement) {
                        let url = linkElement.parentElement.getAttribute('href')
                        if (!url.startsWith('/')) {
                                url = '/' + url;
                        }
                //        console.log('linkElement was href af')                // ~ another debug log
                        return baseUrl + url;
                }
                                  
                // da fallback :)
                const fallbackLink = postElement.querySelector('a[href*="/post/"]');
                if (fallbackLink) {
                        let url = fallbackLink.getAttribute('href');
                        if (!url.startsWith('/')) {
                                url = '/' + url;
                        }
                //        console.log('da fallback');                           // ~ more debug!
                        return baseUrl + url;
                }

                return null;
        }

        const observer = new MutationObserver(bskyCopyButton); // this is what makes the script continuously work for newly loaded posts.
        observer.observe(document.body, { childList: true, subtree: true });

        bskyCopyButton();
})();