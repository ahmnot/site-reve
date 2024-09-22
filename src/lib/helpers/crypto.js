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
  

	// Function to randomly choose one or two consecutive letters
	export function getRandomOneOrTwoLetters(textArray) {
		const length = textArray.length;
		const showTwoLetters = Math.random() > 0; // 100% chance to show 2 letters
		let selectedLetters = [];

		if (showTwoLetters && length > 1) {
			// Select a random starting index ensuring there's room for two letters
			const startIndex = Math.floor(Math.random() * (length - 1));
			selectedLetters = [textArray[startIndex], textArray[startIndex + 1]];
		} else {
			// Select a random single letter
			const index = Math.floor(Math.random() * length);
			selectedLetters = [textArray[index]];
		}
		return selectedLetters;
	}

  export function addSpacesBetweenLetters(lettersArray) {
    // Join the array of letters with a space
    return lettersArray.join(" ");
  }
  