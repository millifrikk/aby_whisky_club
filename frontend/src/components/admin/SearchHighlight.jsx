import React from 'react';

const SearchHighlight = ({ text, searchTerm, matches = [], className = "" }) => {
  if (!text || (!searchTerm && !matches.length)) {
    return <span className={className}>{text}</span>;
  }

  // Use Fuse.js matches if available for more precise highlighting
  if (matches.length > 0) {
    // Find matches for this text field
    const textMatches = matches.filter(match => 
      match.value && typeof match.value === 'string' && match.value === text
    );

    if (textMatches.length > 0 && textMatches[0].indices) {
      // Use Fuse.js indices for precise highlighting
      const indices = textMatches[0].indices;
      let highlightedText = [];
      let lastIndex = 0;

      indices.forEach(([start, end], index) => {
        // Add text before match
        if (start > lastIndex) {
          highlightedText.push(
            <span key={`text-${index}`}>
              {text.slice(lastIndex, start)}
            </span>
          );
        }

        // Add highlighted match
        highlightedText.push(
          <mark 
            key={`match-${index}`}
            className="bg-yellow-200 text-yellow-900 px-0.5 rounded font-medium"
          >
            {text.slice(start, end + 1)}
          </mark>
        );

        lastIndex = end + 1;
      });

      // Add remaining text
      if (lastIndex < text.length) {
        highlightedText.push(
          <span key="text-end">
            {text.slice(lastIndex)}
          </span>
        );
      }

      return <span className={className}>{highlightedText}</span>;
    }
  }

  // Fallback to simple term highlighting
  if (searchTerm) {
    const terms = searchTerm.toLowerCase().split(' ').filter(term => term.length > 1);
    let highlightedText = text;

    terms.forEach((term, termIndex) => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, (match) => 
        `<mark class="bg-yellow-200 text-yellow-900 px-0.5 rounded font-medium search-highlight-${termIndex}">${match}</mark>`
      );
    });

    return (
      <span 
        className={className}
        dangerouslySetInnerHTML={{ __html: highlightedText }}
      />
    );
  }

  return <span className={className}>{text}</span>;
};

export default SearchHighlight;