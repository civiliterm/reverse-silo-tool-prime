import React, { useState, FC, useEffect } from "react";
import { Copy, Plus, X } from "lucide-react";
import { nanoid } from 'nanoid';

// Simple UI component stubs for a consistent look
const Card: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 sm:p-10 mb-8">
    {children}
  </div>
);
const CardContent: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);
const Input: FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition-shadow"
  />
);
const Textarea: FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (
  props
) => (
  <textarea
    {...props}
    className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 focus:outline-none"
  />
);
const Button: FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <button
    {...props}
    className={`py-2 px-4 rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50 ${className}`}
  >
    {children}
  </button>
);

const IconButton: FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: React.ReactNode }> = ({ children, className = "", icon, ...props }) => (
    <button
        {...props}
        className={`flex items-center justify-center p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50 ${className}`}
    >
        {icon}
        {children && <span className="ml-2">{children}</span>}
    </button>
);

interface Post {
    id: string;
    title: string;
    url: string;
}

const getUrlSlug = (url: string): string => {
    try {
        const urlObj = new URL(url.trim());
        const pathname = urlObj.pathname.split("/").filter(Boolean).pop();
        return pathname ? pathname.replace(/-/g, ' ') : '';
    } catch (e) {
        // If it's not a valid URL, treat the whole string as a slug/title
        return url.replace(/-/g, ' ').trim();
    }
};

const App: FC = () => {
    const [homePageUrl, setHomePageUrl] = useState<string>("");
    const [targetPageUrl, setTargetPageUrl] = useState<string>("");
    const [targetPageKeyword, setTargetPageKeyword] = useState<string>("");
    const [bulkUrls, setBulkUrls] = useState<string>("");
    const [posts, setPosts] = useState<Post[]>([]);
    const [statPage1Url, setStatPage1Url] = useState<string>("");
    const [statPage2Url, setStatPage2Url] = useState<string>("");
    const [redditUrl, setRedditUrl] = useState<string>("");
    const [perplexityUrl, setPerplexityUrl] = useState<string>("");

    const [verificationResult, setVerificationResult] = useState<{ type: 'warning' | 'success' | null; message: string | null }>({ type: null, message: null });
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(id);
        } catch (e) {
            console.error('Failed to copy text:', e);
        }
        document.body.removeChild(textArea);
        setTimeout(() => setCopied(null), 2000);
    };

    const addPost = (url: string = '') => {
        const newPost: Post = {
            id: nanoid(),
            title: url,
            url: url
        };
        setPosts(currentPosts => {
            const updatedPosts = [...currentPosts, newPost];
            checkSiloValidity(updatedPosts);
            return updatedPosts;
        });
    };

    const addPostsFromBulk = () => {
        const urls = bulkUrls.split('\n').map(url => url.trim()).filter(url => url);
        if (urls.length > 0) {
            setPosts(currentPosts => {
                const newPosts = urls.map(url => ({
                    id: nanoid(),
                    title: url,
                    url: url
                }));
                const updatedPosts = [...currentPosts, ...newPosts];
                checkSiloValidity(updatedPosts);
                return updatedPosts;
            });
            setBulkUrls('');
        }
    };

    const removePost = (id: string) => {
        setPosts(currentPosts => {
            const updatedPosts = currentPosts.filter(post => post.id !== id);
            checkSiloValidity(updatedPosts);
            return updatedPosts;
        });
    };
    
    const checkSiloValidity = (currentPosts: Post[]) => {
        let isValid = true;
        let message = '🎉 Great job! Your silo plan looks correct!';

        if (currentPosts.length < 2) {
            isValid = false;
            message = 'Add at least two supporting posts to form a silo.';
        }

        if (isValid) {
            setVerificationResult({ type: 'success', message });
        } else {
            setVerificationResult({ type: 'warning', message });
        }
    };
    
    // Initial verification check when posts state changes
    useEffect(() => {
      checkSiloValidity(posts);
    }, [posts]);

    const getLinksList = () => {
        const linksList = [];
        
        // Build the full ordered list of pages
        let allPages = [...posts];
        let siloType = 'Simple Reverse Silo';

        // Check for "Outside-In" silo components
        const hasStatPages = statPage1Url.trim() && statPage2Url.trim();
        const hasExternal = redditUrl.trim() || perplexityUrl.trim();

        if (hasStatPages || hasExternal) {
            siloType = 'Outside-In Reverse Silo';
        }

        if (hasExternal) {
            const externalPosts = [];
            if (redditUrl.trim()) {
                externalPosts.push({ id: nanoid(), title: 'Reddit URL', url: redditUrl });
            }
            if (perplexityUrl.trim()) {
                externalPosts.push({ id: nanoid(), title: 'Perplexity URL', url: perplexityUrl });
            }

            const midpoint = Math.ceil(allPages.length / 2);
            allPages.splice(midpoint, 0, ...externalPosts);
        }

        if (hasStatPages) {
            allPages.unshift({ id: nanoid(), title: 'Stat Page 1', url: statPage1Url });
            allPages.push({ id: nanoid(), title: 'Stat Page 2', url: statPage2Url });
        }

        // Generate links based on the final, ordered list
        allPages.forEach((post, index) => {
            const sourceUrl = post.url;
            const targetLinks = [];
            let sourceLabel = post.title;

            // Update source label for supporting posts
            if (posts.some(p => p.id === post.id)) {
                sourceLabel = `Article ${posts.findIndex(p => p.id === post.id) + 1}`;
            }

            // Link to Target Page
            if (targetPageUrl.trim()) {
                targetLinks.push({
                    url: targetPageUrl,
                    anchorText: `${targetPageKeyword}`
                });
            }

            // Link to next page in chain
            if (index < allPages.length - 1) {
                const nextPost = allPages[index + 1];
                const nextSlug = getUrlSlug(nextPost.title || nextPost.url);
                const nextAnchor = `Learn more about ${nextSlug}`;
                targetLinks.push({
                    url: nextPost.url,
                    anchorText: nextAnchor
                });
            }

            // Link to previous page in chain
            if (index > 0) {
                const prevPost = allPages[index - 1];
                const prevSlug = getUrlSlug(prevPost.title || prevPost.url);
                const prevAnchor = `Go back to our article on ${prevSlug}`;
                targetLinks.push({
                    url: prevPost.url,
                    anchorText: prevAnchor
                });
            }

            if (targetLinks.length > 0) {
                linksList.push({
                    sourceUrl,
                    targetLinks,
                    sourceLabel,
                    id: post.id
                });
            }
        });
        
        // Links from Target Page
        if (targetPageUrl.trim()) {
            const targetOutboundLinks = [];
            
            // Link to Home Page
            if (homePageUrl.trim()) {
                targetOutboundLinks.push({
                    url: homePageUrl,
                    anchorText: `Return to our Home Page`
                });
            }

            // Link to first page in the chain
            if (allPages.length > 0) {
                const firstPost = allPages[0];
                let firstPostLabel = `Article ${posts.findIndex(p => p.id === firstPost.id) + 1}`;
                if (!posts.some(p => p.id === firstPost.id)) { // External post
                    firstPostLabel = firstPost.title;
                }
                targetOutboundLinks.push({
                    url: firstPost.url,
                    anchorText: `Explore our first guide on ${getUrlSlug(firstPost.title || firstPost.url)}`
                });
            }
            
            // Link to last page in the chain (if more than one)
            if (allPages.length > 1) {
                const lastPost = allPages[allPages.length - 1];
                let lastPostLabel = `Article ${posts.findIndex(p => p.id === lastPost.id) + 1}`;
                if (!posts.some(p => p.id === lastPost.id)) {
                    lastPostLabel = lastPost.title;
                }
                targetOutboundLinks.push({
                    url: lastPost.url,
                    anchorText: `Find out more from our last article on ${getUrlSlug(lastPost.title || lastPost.url)}`
                });
            }

            if (targetOutboundLinks.length > 0) {
                 linksList.unshift({
                    sourceUrl: targetPageUrl,
                    targetLinks: targetOutboundLinks,
                    sourceLabel: 'Target Page',
                    id: 'target-page'
                });
            }
        }

        return { linksList, siloType };
    };

    const { linksList, siloType } = getLinksList();

    const handleCopyAll = (entry) => {
        let text = `From: ${entry.sourceUrl}\n\n`;
        entry.targetLinks.forEach(link => {
            text += `Link to: ${link.url}\n`;
            text += `Anchor Text: ${link.anchorText}\n\n`;
        });
        handleCopy(text, `all-${entry.id}`);
    };

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
            <div className="container mx-auto">
                <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-2">Reverse Silo Planner 🚀</h1>
                <p className="text-center text-gray-600 mb-8">Plan your content silo to boost a single target page's SEO.</p>

                {/* Core Pages Section */}
                <Card>
                    <CardContent>
                        <h2 className="text-2xl font-semibold text-blue-800 mb-4">1. Your Core Pages 🎯</h2>
                        <p className="text-sm text-gray-700 mb-4">
                            Define the home page and the single, important page you want to rank higher.
                        </p>
                        <Input type="text" placeholder="Home Page URL" value={homePageUrl} onChange={(e) => setHomePageUrl(e.target.value)} />
                        <Input type="text" placeholder="Target Page URL (e.g., /products/my-tool)" value={targetPageUrl} onChange={(e) => setTargetPageUrl(e.target.value)} />
                        <Input type="text" placeholder="Primary Keyword (e.g., 'best social media tool')" value={targetPageKeyword} onChange={(e) => setTargetPageKeyword(e.target.value)} />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-6">Outside-In Silo Links (Optional)</h3>
                        <p className="text-sm text-gray-700 mb-4">
                             These links will be automatically added to your silo plan.
                        </p>
                        <Input type="text" placeholder="Stat Page 1 URL" value={statPage1Url} onChange={(e) => setStatPage1Url(e.target.value)} />
                        <Input type="text" placeholder="Stat Page 2 URL" value={statPage2Url} onChange={(e) => setStatPage2Url(e.target.value)} />
                        <Input type="text" placeholder="Reddit URL" value={redditUrl} onChange={(e) => setRedditUrl(e.target.value)} />
                        <Input type="text" placeholder="Perplexity URL" value={perplexityUrl} onChange={(e) => setPerplexityUrl(e.target.value)} />
                    </CardContent>
                </Card>

                {/* Supporting Posts Section */}
                <Card>
                    <CardContent>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Supporting Posts ✍️</h2>
                        <p className="text-sm text-gray-700 mb-4">
                            These articles pass link authority to your Target Page and to each other.
                        </p>
                        
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Bulk Add from URLs</h3>
                            <p className="text-sm text-gray-600 mb-4">Paste multiple URLs, one per line.</p>
                            <Textarea rows={4} placeholder="Paste your URLs here..." value={bulkUrls} onChange={(e) => setBulkUrls(e.target.value)} />
                            <Button onClick={addPostsFromBulk} className="w-full bg-gray-600 text-white hover:bg-gray-700">
                                Add from List
                            </Button>
                        </div>

                        <div id="supportingPostsContainer" className="space-y-6">
                            {posts.map((post, index) => (
                                <div key={post.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200 relative transition-all duration-300 transform hover:scale-[1.01]">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Supporting Post #{index + 1}</h3>
                                    <div className="mb-4">
                                        <Input type="text" placeholder="Post Title/Topic (or URL)" value={post.title} onChange={(e) => setPosts(currentPosts => currentPosts.map(p => p.id === post.id ? {...p, title: e.target.value} : p))} />
                                    </div>
                                    <Button onClick={() => removePost(post.id)} className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 bg-transparent shadow-none">
                                        <X size={24} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button onClick={() => addPost()} className="w-full sm:w-auto mt-6 py-3 px-6 bg-purple-600 text-white font-semibold hover:bg-purple-700">
                            + Add Single Supporting Post
                        </Button>
                    </CardContent>
                </Card>

                {/* Links List Section */}
                {linksList.length > 0 && (
                    <Card>
                        <CardContent>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Your Linking Plan ✨</h2>
                            <p className="text-sm text-gray-700 mb-4">
                                This is a **{siloType}**. Use this list to implement the internal links in your articles.
                            </p>
                            <div className="space-y-6">
                                {linksList.map((entry, index) => {
                                    return (
                                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    From: <span className="font-normal text-sm sm:text-base break-words">{entry.sourceLabel} - {entry.sourceUrl}</span>
                                                </h3>
                                                <IconButton onClick={() => handleCopy(entry.sourceUrl, `url-${entry.id}`)} icon={<Copy size={16} />} className="text-gray-500 hover:text-gray-800" title="Copy URL" />
                                            </div>
                                            <ul className="mt-2 space-y-2">
                                                {entry.targetLinks.map((link, linkIndex) => (
                                                    <li key={linkIndex} className="text-sm text-gray-700 p-2 border border-gray-100 rounded-md bg-white flex justify-between items-center">
                                                        <div>
                                                            <span className="font-medium block mb-1">Link to:</span>
                                                            <span className="break-words">{link.url}</span>
                                                            <span className="font-medium block mt-2 mb-1">Anchor Text:</span>
                                                            <span className="break-words">{link.anchorText}</span>
                                                        </div>
                                                        <IconButton onClick={() => handleCopy(link.url, `link-${entry.id}-${linkIndex}`)} icon={<Copy size={16} />} className="text-gray-500 hover:text-gray-800" title="Copy URL" />
                                                    </li>
                                                ))}
                                            </ul>
                                            <Button onClick={() => handleCopyAll(entry)} className="w-full mt-4 bg-green-600 text-white hover:bg-green-700 text-sm py-1 px-3">
                                                {copied === `all-${entry.id}` ? 'Copied All Links!' : 'Copy All Links'}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Verification Section */}
                <Card>
                    <CardContent>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Verify Your Silo ✅</h2>
                        <p className="text-sm text-gray-700 mb-4">
                            Check your plan against the three rules to ensure it's a correct reverse content silo.
                        </p>
                        <div className={`p-6 rounded-xl border ${verificationResult.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <ul className="space-y-2 text-gray-700">
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">
                                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </span>
                                    <p>Does each supporting post link to only **one** Target Page?</p>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </span>
                                    <p>Does each supporting post link out to only one or two other silo pages?</p>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">
                                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </span>
                                    <p>Are there no other outbound links in the body of the supporting content?</p>
                                </li>
                            </ul>
                            <div className={`mt-4 p-4 text-center text-sm font-medium rounded-lg ${verificationResult.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {verificationResult.message || 'Fill in the details above to check your silo.'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default App;
