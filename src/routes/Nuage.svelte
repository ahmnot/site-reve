<script>  
    // Define the pattern of the cloud using a 2D array
    // 2 represents a black square (border of the cloud)
    // 1 represents a white square (part of the cloud)
    // 0 represents a transparent square (outside the cloud)
    const cloudPattern = [
      [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 2, 1, 1, 1, 1, 1, 2, 0, 0, 0, 0],
      [0, 0, 0, 0, 2, 1, 1, 1, 1, 1, 1, 1, 2, 0, 0, 0],
      [0, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 0, 0, 0],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 0],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0]
    ];
  </script>
  
  <div class="cloud">
    {#each cloudPattern as row}
      {#each row as cell}
        <div class="square {cell === 2 ? 'black' : cell === 1 ? 'white' : 'transparent'}"></div>
      {/each}
    {/each}
  </div>
  
  <style>
    .cloud {
      --square-size: 7px;
      display: grid;
      grid-template-columns: repeat(16, var(--square-size));
    }
  
    .square {
      width: var(--square-size);
      height: var(--square-size);
    }
  
    .black {
      background-color: black;
    }
  
    .white {
      background-color: white;
    }
  
    .transparent {
      background-color: transparent;
    }
  </style>
  