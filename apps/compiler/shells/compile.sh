#!/bin/bash
#
# Compiles given source, running pdflatex on it couple of times
#
# Usage
#   bash compile.sh [rootdir] [target]
#
# Note: target is a relative to rootdir path
#
# Output
#   On success returns name of produced PDF, otherwise
#   exits with code 1

#####################
# F U N C T I O N S #
#####################

##############
# START HERE #
##############

if [[ $# != 5 ]]; then
    echo "Not enough arguments!" >&2
    echo "Usage: bash compile.sh [rootdir] [target] [command] [outputFile] [logFile]" >&2
    exit 1
fi

rootdir="${1%/}"
target="$2"
command="$3"
outputFile="$4"
logFile="$5"

export LC_ALL=C.UTF-8
cd $rootdir
LATEXRUN="$(dirname $0)"/../latexrun/latexrun
# latexrun prints Python SyntaxWarnings for harmless regex escape sequences on
# startup; suppress them so the log only contains the actual compiler output.
export PYTHONWARNINGS="ignore"

# Pick the bibliography tool. biblatex documents are compiled with the biber
# backend (pdflatex -> biber -> pdflatex -> pdflatex), everything else keeps
# the classical bibtex flow. latexrun only ever runs the selected tool when
# the .aux actually requests bibliographic data (see the BibTeX task in
# latexrun), so ordinary documents without a bibliography are unaffected.
bibtool="bibtex"
if grep -qEi '\\(usepackage|PassOptionsToPackage)(\[[^]]*\])?\{biblatex\}' -- "${target}" 2>/dev/null; then
    # Modern biblatex defaults to biber; honor an explicit plain-bibtex backend.
    if grep -qEi 'backend[[:space:]]*=[[:space:]]*bibtex' -- "${target}" 2>/dev/null; then
        bibtool="bibtex"
    else
        bibtool="biber"
    fi
fi

# Keep latexrun's final move on a single device (it uses rename(2), which fails
# when the output file lives on a different mount from the compiler obj dir -
# as inside the per-job container, where /work:/results are separate mounts).
# latexrun writes the final PDF into its own obj dir; we then copy it to the
# requested output path, which is safe across devices.
objdir="$(dirname "${target}")/latex.out"
finalStaged="${objdir}/zz-latex-online-output.pdf"
PYTHONUNBUFFERED=true $LATEXRUN --verbose-cmd --latex-cmd="${command}" --bibtex-cmd="${bibtool}" -Wall -o "${finalStaged}" "${target}" &>"${logFile}"

# A failing bibliography pass must fail the compilation. latexrun stops at the
# first LaTeX error, but when biber/bibtex fails it may still have committed a
# PDF earlier (the tool task aborts the loop afterwards), so the staged file's
# presence alone is not a reliable success signal. biber and bibtex always
# write <jobname>.blg into the object dir - the authoritative record of the
# run (biber additionally reports "ERRORS: N"). Append it to the log so the
# service can produce a structured, actionable error.
jobname="$(basename "${target}" .tex)"
blgFile="${objdir}/${jobname}.blg"
bibliographyFailed=false
if [[ -s "${blgFile}" ]] && grep -qE 'ERROR - |ERRORS:[[:space:]]*[1-9]' -- "${blgFile}"; then
    bibliographyFailed=true
fi
# Defensive fallback for tool failures that never wrote a .blg (e.g. the tool
# binary itself missing): latexrun echoes "failed to execute bibtex task" and
# the tool's stderr into the log on the catastrophic path.
if ! $bibliographyFailed && \
   grep -qEi 'failed to execute bibtex task|(^|[^A-Za-z])> ERROR - ' -- "${logFile}" 2>/dev/null; then
    bibliographyFailed=true
fi

if [[ ! -e "${finalStaged}" ]]; then
    echo "ERROR: failed to locate PDF file."
    exit 1
elif $bibliographyFailed; then
    {
        echo ""
        echo "=== ${bibtool} log (${blgFile}) ==="
        cat "${blgFile}" 2>/dev/null
    } >> "${logFile}"
    echo "ERROR: bibliography processing failed (${bibtool})." >&2
    exit 1
else
    cp "${finalStaged}" "${outputFile}"
    rm -f "${finalStaged}"
    echo "SUCCESS: created ${outputFile}"
fi

