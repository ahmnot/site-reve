export function vigenereEncode(plaintext, keyword = "pluie") {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let encoded = '';
    
    for (let i = 0, j = 0; i < plaintext.length; i++) {
      const currentLetter = plaintext[i].toUpperCase();
      
      if (alphabet.includes(currentLetter)) {
        const shift = alphabet.indexOf(keyword[j % keyword.length].toUpperCase());
        const letterIndex = (alphabet.indexOf(currentLetter) + shift) % 26;
        encoded += alphabet[letterIndex];
        j++;
      } else {
        encoded += currentLetter; // Preserve non-alphabetic characters
      }
    }
    return encoded;
  }
  
  function vigenereDecode(ciphertext, keyword) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let decoded = '';
  
    for (let i = 0, j = 0; i < ciphertext.length; i++) {
      const currentLetter = ciphertext[i].toUpperCase();
  
      if (alphabet.includes(currentLetter)) {
        const shift = alphabet.indexOf(keyword[j % keyword.length].toUpperCase());
        const letterIndex = (alphabet.indexOf(currentLetter) - shift + 26) % 26;
        decoded += alphabet[letterIndex];
        j++;
      } else {
        decoded += currentLetter;
      }
    }
    return decoded;
  }
  
  // Example usage
  const keyword = "pluie";
  const originalText = "HELLO";
  const encodedText = vigenereEncode(originalText, keyword);
  const decodedText = vigenereDecode(encodedText, keyword);
  