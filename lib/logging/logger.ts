import fs from 'fs';
import path from 'path';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'payment' | 'booking' | 'email' | 'auth' | 'system';
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private logDir: string;
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private maxFiles: number = 5;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFileName(category: string): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${category}-${date}.log`);
  }

  private shouldRotateFile(filePath: string): boolean {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    const stats = fs.statSync(filePath);
    return stats.size >= this.maxFileSize;
  }

  private rotateFile(filePath: string) {
    const dir = path.dirname(filePath);
    const basename = path.basename(filePath, '.log');
    const ext = '.log';

    // Find existing rotated files
    const files = fs.readdirSync(dir)
      .filter(file => file.startsWith(basename) && file.endsWith(ext))
      .sort()
      .reverse();

    // Remove oldest files if we exceed maxFiles
    if (files.length >= this.maxFiles) {
      for (let i = this.maxFiles - 1; i < files.length; i++) {
        fs.unlinkSync(path.join(dir, files[i]));
      }
    }

    // Rotate existing files
    for (let i = files.length - 1; i >= 0; i--) {
      const oldPath = path.join(dir, files[i]);
      const match = files[i].match(/(.+)-(\d+)\.log$/);
      const newNumber = match ? parseInt(match[2]) + 1 : 1;
      const newPath = path.join(dir, `${basename}-${newNumber}${ext}`);
      fs.renameSync(oldPath, newPath);
    }
  }

  private writeLog(entry: LogEntry) {
    const logFile = this.getLogFileName(entry.category);
    
    if (this.shouldRotateFile(logFile)) {
      this.rotateFile(logFile);
    }

    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(logFile, logLine);
  }

  public log(
    level: LogEntry['level'],
    category: LogEntry['category'],
    message: string,
    data?: any,
    userId?: string,
    sessionId?: string
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      userId,
      sessionId
    };

    this.writeLog(entry);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}`, data || '');
    }
  }

  public info(category: LogEntry['category'], message: string, data?: any, userId?: string, sessionId?: string) {
    this.log('info', category, message, data, userId, sessionId);
  }

  public warn(category: LogEntry['category'], message: string, data?: any, userId?: string, sessionId?: string) {
    this.log('warn', category, message, data, userId, sessionId);
  }

  public error(category: LogEntry['category'], message: string, data?: any, userId?: string, sessionId?: string) {
    this.log('error', category, message, data, userId, sessionId);
  }

  public debug(category: LogEntry['category'], message: string, data?: any, userId?: string, sessionId?: string) {
    this.log('debug', category, message, data, userId, sessionId);
  }

  public getLogFiles(): string[] {
    return fs.readdirSync(this.logDir).filter(file => file.endsWith('.log'));
  }

  public readLogFile(filename: string, lines?: number): LogEntry[] {
    const filePath = path.join(this.logDir, filename);
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const logLines = content.trim().split('\n').filter(line => line.length > 0);

    if (lines) {
      const startIndex = Math.max(0, logLines.length - lines);
      return logLines.slice(startIndex).map(line => JSON.parse(line));
    }

    return logLines.map(line => JSON.parse(line));
  }

  public clearLogs(category?: string) {
    const files = this.getLogFiles();
    const filesToDelete = category 
      ? files.filter(file => file.startsWith(category))
      : files;

    for (const file of filesToDelete) {
      fs.unlinkSync(path.join(this.logDir, file));
    }
  }

  public getLogStats() {
    const files = this.getLogFiles();
    const stats = {
      totalFiles: files.length,
      categories: {} as Record<string, number>,
      totalSize: 0
    };

    for (const file of files) {
      const filePath = path.join(this.logDir, file);
      const fileStats = fs.statSync(filePath);
      stats.totalSize += fileStats.size;

      const category = file.split('-')[0];
      stats.categories[category] = (stats.categories[category] || 0) + 1;
    }

    return stats;
  }
}

// Export singleton instance
export const logger = new Logger();
