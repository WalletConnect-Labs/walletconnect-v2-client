// -- uri -------------------------------------------------- //

export function formatQueryString(params: any) {
  let result = "";

  Object.keys(params).forEach((key) => {
    const value = params[key];
    const delimiter = !result.length ? "?" : "&";
    result = result + delimiter + key + "=" + value;
  });

  return result;
}

export function formatUri(
  protocol: string,
  version: number,
  topic: string,
  params: any
) {
  return `${protocol}:${topic}@${version}` + formatQueryString(params);
}

export function parseQueryString(queryString: string): any {
  const result: any = {};

  const pairs = (queryString[0] === "?"
    ? queryString.substr(1)
    : queryString
  ).split("&");

  for (let i = 0; i < pairs.length; i++) {
    const keyArr: string[] = pairs[i].match(/\w+(?==)/i) || [];
    const valueArr: string[] = pairs[i].match(/=.+/i) || [];
    if (keyArr[0]) {
      result[decodeURIComponent(keyArr[0])] = decodeURIComponent(
        valueArr[0].substr(1)
      );
    }
  }

  return result;
}

export function parseUri(str: string): any {
  const pathStart: number = str.indexOf(":");

  const pathEnd: number | undefined =
    str.indexOf("?") !== -1 ? str.indexOf("?") : undefined;

  const protocol: string = str.substring(0, pathStart);

  const path: string = str.substring(pathStart + 1, pathEnd);

  function parseRequiredParams(path: string) {
    const separator = "@";

    const values = path.split(separator);

    const requiredParams = {
      topic: values[0],
      version: parseInt(values[1], 10),
    };

    return requiredParams;
  }

  const requiredParams = parseRequiredParams(path);

  const queryString: string =
    typeof pathEnd !== "undefined" ? str.substr(pathEnd) : "";

  const queryParams = parseQueryString(queryString);

  const result = {
    protocol,
    ...requiredParams,
    ...queryParams,
  };

  return result;
}
