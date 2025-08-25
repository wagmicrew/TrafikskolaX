-- CMS System Setup Script
-- Run this in your Neon database if the Node.js script fails

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  excerpt TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  is_static BOOLEAN DEFAULT FALSE,
  static_path VARCHAR(255),
  author_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES menu_items(id),
  label VARCHAR(255) NOT NULL,
  url VARCHAR(255),
  page_id UUID REFERENCES pages(id),
  is_external BOOLEAN DEFAULT FALSE,
  icon VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_admin_menu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create page_images table
CREATE TABLE IF NOT EXISTS page_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  path VARCHAR(500) NOT NULL,
  size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_menu_items_parent_id ON menu_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort_order ON menu_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_admin_menu ON menu_items(is_admin_menu);
CREATE INDEX IF NOT EXISTS idx_page_images_page_id ON page_images(page_id);

-- Add comments
COMMENT ON TABLE pages IS 'Stores page content for the CMS system';
COMMENT ON TABLE menu_items IS 'Stores menu navigation items';
COMMENT ON TABLE page_images IS 'Stores images uploaded to pages';

-- Insert default pages
INSERT INTO pages (slug, title, content, excerpt, status) VALUES
('hem', 'Hem', '<h1>Välkommen till Trafikskola X</h1><p>Din partner för säker körning och trafikskola.</p>', 'Välkommen till Trafikskola X - din partner för säker körning.', 'published'),
('om-oss', 'Om oss', '<h1>Om oss</h1><p>Vi är specialiserade på att utbilda säkra och kompetenta förare med många års erfarenhet.</p>', 'Lär dig mer om vår trafikskola och vårt team.', 'published'),
('kontakt', 'Kontakt', '<h1>Kontakt</h1><p>Kontakta oss för frågor om våra tjänster och kurser.</p>', 'Kontakta oss för att få mer information om våra tjänster.', 'published')
ON CONFLICT (slug) DO NOTHING;

-- Insert default menu items (after pages are created)
INSERT INTO menu_items (label, url, page_id, is_external, icon, sort_order, is_active, is_admin_menu) VALUES
('Hem', '/', NULL, FALSE, 'Home', 1, TRUE, FALSE),
('Om oss', NULL, (SELECT id FROM pages WHERE slug = 'om-oss'), FALSE, 'Info', 2, TRUE, FALSE),
('Kontakt', NULL, (SELECT id FROM pages WHERE slug = 'kontakt'), FALSE, 'Phone', 3, TRUE, FALSE);
