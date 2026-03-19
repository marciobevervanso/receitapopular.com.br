
import { AffiliateProduct } from "../types";

/**
 * Calls n8n webhook to get Shopee Affiliate links for a list of products
 */
export const fetchAffiliateLinks = async (
  products: { name: string }[], 
  webhookUrl: string
): Promise<AffiliateProduct[]> => {
  if (!webhookUrl) return [];

  try {
    // 1. Format Payload matching n8n requirements: { utensils: [{ name, search_term }] }
    // Some n8n nodes expect it wrapped in "body" key depending on config, 
    // but standard webhook node usually takes raw JSON body.
    const payload = {
      utensils: products.map(p => ({
        name: p.name,
        search_term: p.name
      }))
    };

    // 2. Call n8n
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`n8n error: ${response.statusText}`);
    }

    // 3. Parse Response
    const rawData = await response.json();
    let utensilsData: any[] = [];

    // ROBUST PARSING: Handle Array vs Object response from n8n
    if (Array.isArray(rawData)) {
        // Case A: n8n returns an array (common with "Respond to Webhook" node set to "JSON")
        // It might be [{ utensils: [...] }] or [{ body: { utensils: [...] } }]
        const firstItem = rawData[0];
        if (firstItem.utensils) {
            utensilsData = firstItem.utensils;
        } else if (firstItem.json && firstItem.json.utensils) {
             // Sometimes n8n leaks internal structure
            utensilsData = firstItem.json.utensils;
        }
    } else if (rawData && typeof rawData === 'object') {
        // Case B: n8n returns a single object
        if (rawData.utensils) {
            utensilsData = rawData.utensils;
        }
    }
    
    // 4. Map back to AffiliateProduct
    const results: AffiliateProduct[] = [];
    
    if (Array.isArray(utensilsData)) {
        utensilsData.forEach((u: any) => {
            if (u.affiliate_link) {
                results.push({
                    name: u.name,
                    url: u.affiliate_link,
                    // If price is available in future, map it here:
                    // price: u.price_info 
                });
            }
        });
    }

    return results;

  } catch (error) {
    console.error("Affiliate Service Error:", error);
    return [];
  }
};
