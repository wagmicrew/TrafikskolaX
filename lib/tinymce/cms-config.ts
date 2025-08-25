import { Editor } from 'tinymce';

export interface TinyMCEConfig {
  height: number;
  menubar: boolean;
  plugins: string[];
  toolbar: string;
  toolbar_sticky: boolean;
  toolbar_sticky_offset: number;
  image_advtab: boolean;
  image_title: boolean;
  automatic_uploads: boolean;
  file_picker_types: string;
  paste_data_images: boolean;
  content_style: string;
  language: string;
  language_url?: string;
  promotion: boolean;
  branding: boolean;
  setup?: (editor: Editor) => void;
  images_upload_handler?: (blobInfo: any, success: (url: string) => void, failure: (error: string) => void) => void;
}

export const createCmsConfig = (onSave?: (content: string) => void): TinyMCEConfig => {
  return {
    height: 500,
    menubar: true,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
      'template', 'codesample', 'hr', 'pagebreak', 'nonbreaking', 'toc',
      'imagetools', 'textpattern', 'noneditable', 'quickbars', 'importcss'
    ],
    toolbar: `undo redo | blocks | ' +
      'bold italic forecolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | help | link image media table | fullscreen preview save print | ' +
      'insertfile image media template codesample | ltr rtl | emoticons charmap | pagebreak | anchor | ' +
      'searchreplace visualblocks code | hr nonbreaking | toc insertdatetime`,

    toolbar_sticky: true,
    toolbar_sticky_offset: 102,

    // Image settings
    image_advtab: true,
    image_title: true,
    automatic_uploads: true,
    file_picker_types: 'image',
    paste_data_images: true,

    // Content styling
    content_style: `
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: #333;
        margin: 20px;
      }
      img {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 20px 0;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
        font-weight: bold;
      }
      .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before {
        color: #aaa;
        font-style: italic;
      }
    `,

    // Language settings
    language: 'sv_SE',
    language_url: '/tinymce/langs/sv_SE.js',

    // Disable promotion and branding
    promotion: false,
    branding: false,

    // Custom save button functionality
    setup: (editor) => {
      if (onSave) {
        editor.ui.registry.addButton('customsave', {
          text: 'Spara',
          icon: 'save',
          onAction: () => {
            const content = editor.getContent();
            onSave(content);
          }
        });
      }

      // Custom image upload handler
      editor.on('paste', (e) => {
        // Handle pasted images
        const items = e.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf('image') === 0) {
              e.preventDefault();
              const file = item.getAsFile();
              if (file) {
                uploadImage(file, (url) => {
                  editor.insertContent(`<img src="${url}" alt="Uppladdad bild" />`);
                }, (error) => {
                  console.error('Error uploading pasted image:', error);
                });
              }
            }
          }
        }
      });
    },

    // Image upload handler
    images_upload_handler: (blobInfo, success, failure) => {
      const file = new File([blobInfo.blob()], blobInfo.filename(), { type: blobInfo.blob().type });

      uploadImage(file, success, failure);
    }
  };
};

// Helper function to upload images
async function uploadImage(
  file: File,
  success: (url: string) => void,
  failure: (error: string) => void
) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/admin/cms/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      failure(errorData.error || 'Kunde inte ladda upp bilden');
      return;
    }

    const data = await response.json();
    success(data.location);
  } catch (error) {
    console.error('Error uploading image:', error);
    failure('Kunde inte ladda upp bilden');
  }
}

// Configuration for simple text area (no images, minimal toolbar)
export const createSimpleConfig = (): TinyMCEConfig => {
  return {
    height: 300,
    menubar: false,
    plugins: ['lists', 'link', 'charmap', 'wordcount'],
    toolbar: 'bold italic | link | bullist numlist | charmap',
    toolbar_sticky: false,
    content_style: `
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #333;
        margin: 15px;
      }
    `,
    language: 'sv_SE',
    language_url: '/tinymce/langs/sv_SE.js',
    promotion: false,
    branding: false,
  };
};
