/**
 * 本地存储工具
 */
export const storage = {
  /**
   * 设置localStorage
   */
  set(key: string, value: any) {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  /**
   * 获取localStorage
   */
  get(key: string) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  /**
   * 删除localStorage
   */
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  /**
   * 清空localStorage
   */
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

/**
 * sessionStorage工具
 */
export const sessionStorage = {
  set(key: string, value: any) {
    try {
      const serializedValue = JSON.stringify(value);
      window.sessionStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  },

  get(key: string) {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return null;
    }
  },

  remove(key: string) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  },

  clear() {
    try {
      window.sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  },
};
