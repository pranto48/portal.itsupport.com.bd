import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Loads site_title, site_meta_description, and site_favicon_url
 * from app_settings (public read via anon key) and applies them to the document.
 */
export function useSiteSettings() {
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['site_title', 'site_meta_description', 'site_favicon_url']);

      if (!data) return;

      for (const row of data) {
        if (!row.value) continue;

        switch (row.key) {
          case 'site_title':
            document.title = row.value;
            // Update OG + Twitter title
            document.querySelector('meta[property="og:title"]')?.setAttribute('content', row.value);
            document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', row.value);
            break;

          case 'site_meta_description':
            document.querySelector('meta[name="description"]')?.setAttribute('content', row.value);
            document.querySelector('meta[property="og:description"]')?.setAttribute('content', row.value);
            document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', row.value);
            break;

          case 'site_favicon_url': {
            let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = row.value;
            break;
          }
        }
      }
    };

    load();
  }, []);
}
