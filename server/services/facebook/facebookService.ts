interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  full_picture?: string;
  permalink_url: string;
  likes?: { summary: { total_count: number } };
  comments?: { summary: { total_count: number } };
}

interface FacebookFeedOptions {
  layout?: 'timeline' | 'grid';
  showHeader?: boolean;
  showLikes?: boolean;
  showComments?: boolean;
  postsToShow?: number;
  columns?: number;
  width?: number;
}

export class FacebookService {
  private pageId: string;
  private apiVersion = 'v18.0';
  private static instance: FacebookService;

  constructor(pageId?: string) {
    this.pageId = pageId || '61571709076079';
  }

  static getInstance(pageId?: string): FacebookService {
    if (!FacebookService.instance) {
      FacebookService.instance = new FacebookService(pageId);
    }
    return FacebookService.instance;
  }

  /**
   * Charge les posts Facebook avec un token d'accès
   */
  async loadFeedWithToken(container: HTMLElement, token: string, options: FacebookFeedOptions): Promise<void> {
    try {
      const posts = await this.fetchPosts(token, options.postsToShow || 10);
      container.innerHTML = this.generateFeedHtml(posts, options);
    } catch (error) {
      console.error('Error loading Facebook feed:', error);
      throw error;
    }
  }

  /**
   * Récupère les posts via l'API Graph
   */
  private async fetchPosts(token: string, limit: number): Promise<FacebookPost[]> {
    const url = new URL(`https://graph.facebook.com/${this.apiVersion}/${this.pageId}/posts`);
    const params = new URLSearchParams({
      access_token: token,
      limit: limit.toString(),
      fields: 'id,message,created_time,full_picture,permalink_url,likes.summary(true),comments.summary(true)',
    });

    url.search = params.toString();
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error('Failed to fetch Facebook posts');
    }

    const data = await response.json() as { data: FacebookPost[] };
    return data.data;
  }

  /**
   * Génère le HTML pour le feed
   */
  private generateFeedHtml(posts: FacebookPost[], options: FacebookFeedOptions): string {
    const { layout = 'timeline', showLikes = true, showComments = true } = options;

    const postsHtml = posts.map(post => {
      const date = new Date(post.created_time).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      return `
        <div class="fb-post">
          <div class="post-header">
            <div class="post-date">${date}</div>
          </div>
          
          ${post.message ? `
            <div class="post-message">
              ${this.escapeHtml(post.message)}
            </div>
          ` : ''}
          
          ${post.full_picture ? `
            <div class="post-image">
              <img src="${post.full_picture}" alt="" loading="lazy">
            </div>
          ` : ''}
          
          ${(showLikes || showComments) ? `
            <div class="post-footer">
              ${showLikes ? `
                <div class="post-likes">
                  <i class="fas fa-thumbs-up"></i>
                  <span>${post.likes?.summary.total_count || 0}</span>
                </div>
              ` : ''}
              
              ${showComments ? `
                <div class="post-comments">
                  <i class="fas fa-comment"></i>
                  <span>${post.comments?.summary.total_count || 0}</span>
                </div>
              ` : ''}
              
              <a href="${post.permalink_url}" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 class="post-link"
              >
                Voir sur Facebook
              </a>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="custom-fb-feed ${layout}" data-columns="${options.columns || 1}">
        ${postsHtml}
      </div>
    `;
  }

  /**
   * Échappe les caractères HTML pour la sécurité
   */
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Génère le HTML pour le plugin Page Facebook
   */
  getPagePluginHtml(options: {
    layout: 'timeline' | 'grid'
    showHeader: boolean
    showLikes: boolean
    showComments: boolean
    postsToShow: number
    columns: number
    width: number
    locale: string
  }): string {
    const tabs = [];
    if (options.showLikes) tabs.push('timeline');
    if (options.showComments) tabs.push('messages');

    const tabsStr = tabs.length > 0 ? tabs.join(',') : 'timeline';

    return `
      <div class="fb-page"
        data-href="https://www.facebook.com/${this.pageId}"
        data-tabs="${tabsStr}"
        data-width="${options.width}"
        data-height=""
        data-small-header="${!options.showHeader}"
        data-adapt-container-width="true"
        data-hide-cover="false"
        data-show-facepile="true">
      </div>
    `;
  }

  /**
   * Parse les plugins Facebook dans un conteneur
   */
  parseFacebookPlugins(container: HTMLElement): void {
    if (window.FB?.XFBML?.parse) {
      window.FB.XFBML.parse(container);
    }
  }
}
