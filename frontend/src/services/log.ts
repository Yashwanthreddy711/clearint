export const log = (scope: string, event: string, data?: any) => {
    console.log(
      `%c[${scope}] ${event}`,
      "color: #4CAF50; font-weight: bold;",
      data || ""
    );
  };