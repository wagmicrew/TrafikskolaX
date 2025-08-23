/**
 * Centralized TinyMCE configuration for UTF-8 handling
 * This ensures consistent behavior across all TinyMCE instances
 */

export interface TinyMCEConfig {
  height: number;
  plugins: string[];
  toolbar: string;
  menubar: string;
  statusbar: boolean;
  elementpath: boolean;
  resize: boolean;
  language: string;
  skin: string;
  branding: boolean;
  promotion: boolean;

  // UTF-8 and encoding settings
  encoding: string;
  entities: string;
  entity_encoding: string;

  // Content handling
  content_style: string;
  content_css: string;

  // Paste and cleanup settings
  paste_as_text: boolean;
  paste_data_images: boolean;
  paste_retain_style_properties: string;
  paste_merge_formats: boolean;
  paste_auto_cleanup_on_paste: boolean;
  paste_remove_styles: boolean;
  paste_remove_styles_if_webkit: boolean;
  paste_strip_class_attributes: string;

  // Content validation - relaxed for UTF-8
  valid_elements: string;
  invalid_elements: string;
  extended_valid_elements: string;
  valid_children: string;

  // Protection - minimal to preserve UTF-8
  protect: RegExp[];

  // Force blocks and formatting
  forced_root_block: string;
  forced_root_block_attrs: Record<string, string>;
  remove_trailing_brs: boolean;
  verify_html: boolean;

  // Security settings
  allow_conditional_comments: boolean;
  allow_html_in_named_anchor: boolean;
  convert_fonts_to_spans: boolean;
  convert_urls: boolean;
  custom_elements: boolean;
  doctype: string;

  // List and table handling
  fix_list_elements: boolean;
  fix_table_elements: boolean;

  // Schema and validation
  schema: string;
  element_format: string;

  // Image handling
  images_upload_handler?: (blobInfo: any) => Promise<string>;
  image_title: boolean;
  automatic_uploads: boolean;
  file_picker_types: string;

  // Mobile settings
  mobile?: Record<string, any>;

  // Context menu and quickbars
  contextmenu?: string;
  quickbars_insert_toolbar?: string;
  quickbars_selection_toolbar?: string;

  // Spell checking
  spellchecker_active?: boolean;
  spellchecker_language?: string;
  spellchecker_languages?: string;

  // Code samples
  codesample_global_prismjs?: boolean;
  codesample_languages?: any[];

  // Template variables (for email templates)
  setup?: (editor: any) => void;

  // Custom variables
  variables?: any[];
}

// Base UTF-8 friendly configuration
export const createBaseTinyMCEConfig = (overrides: Partial<TinyMCEConfig> = {}): TinyMCEConfig => {
  const baseConfig: TinyMCEConfig = {
    height: 500,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'codesample',
      'emoticons', 'template', 'pagebreak', 'nonbreaking', 'visualchars',
      'quickbars', 'directionality', 'paste'
    ],
    toolbar: 'undo redo | blocks | ' +
      'bold italic forecolor backcolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | help | image media link | code | preview | fullscreen | ' +
      'table | emoticons | codesample | template | pagebreak | ' +
      'insertdatetime | searchreplace | visualblocks | ' +
      'variables',
    menubar: 'edit view insert format tools table help',
    statusbar: true,
    elementpath: true,
    resize: true,
    language: 'sv_SE',
    skin: 'oxide',
    branding: false,
    promotion: false,

    // UTF-8 encoding settings
    encoding: 'utf-8',
    entities: '160,nbsp,161,iexcl,162,cent,163,pound,164,curren,165,yen,166,brvbar,167,sect,168,uml,169,copy,170,ordf,171,laquo,172,not,173,shy,174,reg,175,macr,176,deg,177,plusmn,178,sup2,179,sup3,180,acute,181,micro,182,para,183,middot,184,cedil,185,sup1,186,ordm,187,raquo,188,frac14,189,frac12,190,frac34,191,iquest,192,Agrave,193,Aacute,194,Acirc,195,Atilde,196,Auml,197,Aring,198,AElig,199,Ccedil,200,Egrave,201,Eacute,202,Ecirc,203,Euml,204,Igrave,205,Iacute,206,Icirc,207,Iuml,208,ETH,209,Ntilde,210,Ograve,211,Oacute,212,Ocirc,213,Otilde,214,Ouml,215,times,216,Oslash,217,Ugrave,218,Uacute,219,Ucirc,220,Uuml,221,Yacute,222,THORN,223,szlig,224,agrave,225,aacute,226,acirc,227,atilde,228,auml,229,aring,230,aelig,231,ccedil,232,egrave,233,eacute,234,ecirc,235,euml,236,igrave,237,iacute,238,icirc,239,iuml,240,eth,241,ntilde,242,ograve,243,oacute,244,ocirc,245,otilde,246,ouml,247,divide,248,oslash,249,ugrave,250,uacute,251,ucirc,252,uuml,253,yacute,254,thorn,255,yuml',
    entity_encoding: 'named',

    // Content styling - minimal to preserve UTF-8
    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; margin: 1rem; }',
    content_css: '',

    // Paste settings - preserve UTF-8 characters
    paste_as_text: false,
    paste_data_images: true,
    paste_retain_style_properties: 'all',
    paste_merge_formats: true,
    paste_auto_cleanup_on_paste: false, // Disabled to preserve UTF-8
    paste_remove_styles: false,
    paste_remove_styles_if_webkit: false,
    paste_strip_class_attributes: 'none',

    // Content validation - relaxed for UTF-8
    valid_elements: '*[*]', // Allow all elements and attributes to preserve UTF-8
    invalid_elements: 'script,style,meta,link,base,title,noscript,object,embed,applet,param,iframe,frame,frameset,noframes,area,map,form,input,button,select,textarea,fieldset,legend,label,optgroup,option,datalist,keygen,output,progress,meter,details,summary,command,menu,menuitem,dialog,video,audio,source,track,canvas,svg,math,template,slot',
    extended_valid_elements: 'span[class|style|contenteditable],div[class|style|contenteditable],p[class|style|contenteditable],h1[class|style|contenteditable],h2[class|style|contenteditable],h3[class|style|contenteditable],h4[class|style|contenteditable],h5[class|style|contenteditable],h6[class|style|contenteditable]',
    valid_children: '+body[*],+div[*],+p[*],+span[*],+h1[*],+h2[*],+h3[*],+h4[*],+h5[*],+h6[*]',

    // Protection - minimal to avoid interfering with UTF-8
    protect: [
      /<\?[\s\S]*?\?>/g,  // PHP code
      /<script[\s\S]*?<\/script>/gi,  // Script tags
      /<style[\s\S]*?<\/style>/gi,  // Style tags
      /<meta[\s\S]*?\/?>/gi,  // Meta tags
      /<link[\s\S]*?\/?>/gi,  // Link tags
      /<base[\s\S]*?\/?>/gi,  // Base tags
    ],

    // Force blocks and formatting
    forced_root_block: 'p',
    forced_root_block_attrs: { 'class': 'content-paragraph' },
    remove_trailing_brs: true,
    verify_html: false, // Disabled to prevent UTF-8 character modification

    // Security settings - relaxed for UTF-8
    allow_conditional_comments: false,
    allow_html_in_named_anchor: false,
    convert_fonts_to_spans: false, // Disabled to preserve character encoding
    convert_urls: false,
    custom_elements: false,
    doctype: '<!DOCTYPE html>',

    // List and table handling
    fix_list_elements: false, // Disabled to prevent UTF-8 issues
    fix_table_elements: false, // Disabled to prevent UTF-8 issues

    // Schema and validation
    schema: 'html5',
    element_format: 'html',

    // Image handling defaults
    image_title: true,
    automatic_uploads: true,
    file_picker_types: 'image',

    // Mobile settings
    mobile: {
      theme: 'mobile',
      toolbar: ['undo', 'redo', 'bold', 'italic', 'link', 'image'],
      menubar: false
    },

    // Spell checking
    spellchecker_active: true,
    spellchecker_language: 'sv',
    spellchecker_languages: 'Swedish=sv,English=en',

    // Code samples
    codesample_global_prismjs: true,
    codesample_languages: [
      { text: 'HTML/XML', value: 'markup' },
      { text: 'CSS', value: 'css' },
      { text: 'JavaScript', value: 'javascript' },
      { text: 'TypeScript', value: 'typescript' },
      { text: 'Python', value: 'python' },
      { text: 'PHP', value: 'php' },
      { text: 'SQL', value: 'sql' },
      { text: 'JSON', value: 'json' },
      { text: 'Bash', value: 'bash' },
      { text: 'Markdown', value: 'markdown' }
    ]
  };

  return { ...baseConfig, ...overrides };
};

// Email template specific configuration
export const createEmailTemplateConfig = (apiKey: string, imagesUploadHandler?: (blobInfo: any) => Promise<string>): TinyMCEConfig => {
  const baseConfig = createBaseTinyMCEConfig({
    height: 500,
    toolbar: 'undo redo | blocks | ' +
      'bold italic forecolor backcolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | help | image media link | code | preview | fullscreen | ' +
      'table | emoticons | codesample | template | pagebreak | ' +
      'insertdatetime | searchreplace | visualblocks | ' +
      'variables',

    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',

    // Email-specific image handler
    images_upload_handler: imagesUploadHandler,

    // Email template setup
    setup: function(editor: any) {
      // Protect template variables from accidental editing
      editor.on('BeforeSetContent', function(e: any) {
        if (e.content) {
          // Wrap template variables in a protective span to make them non-editable
          e.content = e.content.replace(
            /\{\{([^}]+)\}\}/g,
            '<span class="template-variable" contenteditable="false" style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 4px; padding: 2px 6px; font-family: monospace; color: #1976d2; font-weight: bold; cursor: pointer;" title="Template variable - click to edit with Variables button">{{$1}}</span>'
          );
        }
      });

      // Restore template variables when getting content
      editor.on('GetContent', function(e: any) {
        if (e.content) {
          e.content = e.content.replace(
            /<span class="template-variable"[^>]*>\{\{([^}]+)\}\}<\/span>/g,
            '{{$1}}'
          );
        }
      });

      // Add variables button
      editor.ui.registry.addButton('variables', {
        text: 'Variabler',
        tooltip: 'Infoga variabler',
        icon: 'code',
        onAction: function() {
          const selectedText = editor.selection.getContent();
          if (selectedText) {
            editor.selection.setContent(`{{${selectedText}}}`);
          } else {
            editor.insertContent('{{variable}}');
          }
        }
      });
    }
  });

  return baseConfig;
};

// Side editor specific configuration
export const createSideEditorConfig = (apiKey: string, imagesUploadHandler?: (blobInfo: any) => Promise<string>): TinyMCEConfig => {
  const baseConfig = createBaseTinyMCEConfig({
    height: 700,
    toolbar: 'undo redo | formatselect | ' +
      'bold italic underline strikethrough | forecolor backcolor | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | blockquote | ' +
      'link image media table | code codesample | ' +
      'removeformat | help | preview fullscreen',

    content_style: `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 16px;
        line-height: 1.7;
        color: #2c3e50;
        background-color: #ffffff;
        margin: 2rem;
        max-width: 800px;
        margin-left: auto;
        margin-right: auto;
      }

      h1 { font-size: 2.5rem; font-weight: 700; color: #1a202c; margin: 2rem 0 1rem 0; border-bottom: 3px solid #e2e8f0; padding-bottom: 0.5rem; }
      h2 { font-size: 2rem; font-weight: 600; color: #2d3748; margin: 1.8rem 0 1rem 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
      h3 { font-size: 1.5rem; font-weight: 600; color: #4a5568; margin: 1.6rem 0 0.8rem 0; }
      h4 { font-size: 1.25rem; font-weight: 600; color: #718096; margin: 1.4rem 0 0.6rem 0; }
      h5 { font-size: 1.1rem; font-weight: 600; color: #a0aec0; margin: 1.2rem 0 0.5rem 0; }
      h6 { font-size: 1rem; font-weight: 600; color: #cbd5e0; margin: 1rem 0 0.4rem 0; }

      p { margin: 0 0 1.2rem 0; text-align: justify; }

      ul, ol { margin: 1rem 0; padding-left: 2rem; }
      li { margin: 0.5rem 0; }
      ul li::marker { color: #e53e3e; font-weight: bold; }
      ol li::marker { color: #3182ce; font-weight: bold; }

      a { color: #3182ce; text-decoration: none; border-bottom: 2px solid transparent; transition: border-color 0.2s ease; }
      a:hover { border-bottom-color: #3182ce; }

      pre { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; overflow-x: auto; }
      code { background: #f7fafc; color: #d53f8c; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace; font-size: 0.9em; }

      blockquote { border-left: 4px solid #e53e3e; background: #fff5f5; padding: 1rem 1.5rem; margin: 1.5rem 0; font-style: italic; color: #742a2a; }

      table { border-collapse: collapse; width: 100%; margin: 1.5rem 0; }
      th, td { border: 1px solid #e2e8f0; padding: 0.75rem; text-align: left; }
      th { background: #f7fafc; font-weight: 600; color: #2d3748; }
      tr:nth-child(even) { background: #f8fafc; }

      img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }

      *:focus { outline: 2px solid #3182ce; outline-offset: 2px; }

      @media print {
        body { background: white; color: black; margin: 0; }
        a { color: black; text-decoration: underline; }
      }
    `,

    // Side editor specific image handler
    images_upload_handler: imagesUploadHandler,

    // Context menu and quickbars for side editor
    contextmenu: 'link image table configurepermanentpen',
    quickbars_insert_toolbar: 'quickimage quicktable media codesample | blockquote hr',
    quickbars_selection_toolbar: 'bold italic underline strikethrough | h2 h3 blockquote quicklink'
  });

  return baseConfig;
};
