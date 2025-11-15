const convertMarkdown = (md: string) => {
  if (!md) return "";

  let html = md;

  html = html.replace(/^###\s?(.*)$/gm, `<h3 class="text-xl font-bold my-2">$1</h3>`);
  html = html.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  html = html.replace(/\n/g, "<br/>");

  return html;
};
export default convertMarkdown;
