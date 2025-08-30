import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmailPreviewProps {
  subject: string;
  htmlContent: string;
  schoolName: string;
  className?: string;
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  subject,
  htmlContent,
  schoolName,
  className
}) => {
  // Client-only component
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[500px] bg-slate-50 rounded-md border flex items-center justify-center">Loading preview...</div>;
  }

  return (
    <Card className={cn("bg-white", className)}>
      <CardHeader className="bg-slate-50 border-b">
        <CardTitle className="text-base font-medium">Email Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <div className="text-sm text-muted-foreground">From: {schoolName} &lt;no-reply@trafikskola.se&gt;</div>
          <div className="text-sm text-muted-foreground">To: {`{{recipient}}`}</div>
          <div className="text-sm font-medium mt-2">Subject: {subject}</div>
        </div>
        <div className="p-6 max-h-[600px] overflow-y-auto">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent || '<p>No content</p>' }}
          />
        </div>
        <div className="p-4 border-t bg-slate-50 text-xs text-muted-foreground italic">
          Detta är en förhandsgranskning. Verkliga variabler kommer ersättas när mailet skickas.
        </div>
      </CardContent>
    </Card>
  );
};
