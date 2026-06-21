const initialDocument = `\\documentclass{article}
\\usepackage[utf8]{inputenc}

\\title{My First Document}
\\author{Inking User}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}

This is a sample LaTeX document.

\\end{document}`;

export default function EditorPane() {
  return (
    <div className="flex w-1/2 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-black">untitled.tex</span>
          <span className="text-xs text-gray-400">LaTeX</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Saved
        </div>
      </div>
      <textarea
        className="min-w-0 flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-black outline-none"
        defaultValue={initialDocument}
        spellCheck={false}
      />
    </div>
  );
}
