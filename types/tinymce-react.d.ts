declare module '@tinymce/tinymce-react' {
  import * as React from 'react';

  export interface EditorProps {
    apiKey?: string;
    value?: string;
    initialValue?: string;
    init?: Record<string, any>;
    onEditorChange?: (content: string, editor: any) => void;
    [key: string]: any;
  }

  export class Editor extends React.Component<EditorProps> {}
  export default Editor;
}
