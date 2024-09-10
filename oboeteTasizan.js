"use strict"; // ストリクトモードを有効にする

// ページが読み込まれたら、ゲームの初期化を行う
document.addEventListener("DOMContentLoaded", () => {
    const tiles = document.querySelectorAll(".tile");               // ゲーム内のタイル要素を全て取得
    const targetTiles = document.querySelectorAll(".target-tile");  // ターゲットナンバーを表示するタイル要素を全て取得
    const startButton = document.getElementById("startButton");     // ゲームのスタートボタンを取得
    const startMessage = document.getElementById("startMessage");   // ゲーム開始前のメッセージ要素を取得
    const restartButton = document.getElementById("restartButton"); // ゲームのリスタートボタンを取得
    let clearedNumbers = [];                                        // クリアされたターゲットナンバーを格納するための配列
    let numbers = [];                                               // 現在のゲームで使用される数値を格納するための配列
    let targetNumber;                                               // 現在のターゲットナンバーを保持するための変数
    let selectedTiles = [];                                         // プレイヤーが選択したタイルを格納するための配列
    const messageElement = document.getElementById("message");      // ゲームメッセージを表示する要素を取得
    let isProcessing = false;                                       // 現在タイルの処理中かどうかを示すフラグ

    // 「スタート」ボタンがクリックされた時にゲームを開始する
    startButton.addEventListener("click", () => {
        startMessage.style.display = "none";                                      // スタートメッセージを非表示にする
        document.getElementById("gameBoardContainer").style.display = "block";    // ゲームボードを表示する
        document.getElementById("info").style.display = "block";                  // ターゲットナンバーの情報エリアを表示する
        document.getElementById("targetNumbersContainer").style.display = "flex"; // ターゲットナンバーを表示するエリアを表示する
        startNewGame();                                                           // 新しいゲームを開始する
    });

    // 「スタートに戻る」ボタンがクリックされた時にゲームをリセットする
    restartButton.addEventListener("click", () => {
        resetGame();          
    });

    // Matter.js のエンジンを作成し、紙吹雪の動きを制御する
    const engine = Matter.Engine.create({ 
        gravity: { x: 0, y: 0.4 }  
    });

    // 紙吹雪を描画するキャンバスを取得
    const canvas = document.getElementById('confetti-canvas'); 

    // キャンバスをウィンドウサイズにリサイズする関数
    function resizeCanvas() {
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }

    // 初期ロード時にキャンバスをリサイズ
    resizeCanvas();

    // ウィンドウリサイズ時にもキャンバスをリサイズ
    window.addEventListener('resize', resizeCanvas);

    // Matter.js のレンダラーを作成し、紙吹雪の描画を設定する
    const render = Matter.Render.create({
        canvas: canvas,                   // 紙吹雪を描画するキャンバスを指定
        engine: engine,                   // 物理エンジンを指定
        options: {
            width: canvas.width,          // キャンバスの幅を設定
            height: canvas.height,        // キャンバスの高さを設定
            wireframes: false,            // ワイヤーフレーム表示を無効にする
            background: 'transparent'     // 背景を透明に設定
        }
    });

    // ダイヤモンド形の紙吹雪を作成する関数
    function createDiamond(x, y, color) { 
        const size = Math.random() * 10 + 3;                   // ダイヤモンドのサイズをランダムに設定
        const diamond = Matter.Bodies.polygon(x, y, 4, size, { // ダイヤモンド形のボディを作成し、物理特性を設定する
            render: {
                fillStyle: color,                              // ダイヤモンドの塗りつぶしの色を指定
                strokeStyle: 'rgba(255, 255, 255, 0.3)',       // ダイヤモンドの枠線の色と透明度を指定
                lineWidth: 2                                   // ダイヤモンドの枠線の幅を指定
            },
            restitution: 0.3,                                  // 弾力性を設定
            frictionAir: 0.03,                                 // 空気抵抗を設定
            density: 0.0005,                                   // 密度を設定
            angle: Math.random() * Math.PI                     // ランダムな角度でダイヤモンドを回転させる
        });

        diamond.angularVelocity = (Math.random() - 0.5) * 0.1; // ダイヤモンドにランダムな回転速度を設定

        Matter.Body.applyForce(diamond, diamond.position, {    // ダイヤモンドにランダムな水平力を加える
            x: (Math.random() - 0.5) * 0.002,
            y: 0
        });

        return diamond; // 作成したダイヤモンドを返す
    }

    // 紙吹雪を表示する関数
    function showConfetti() { 
        const colors = ['#FFD700', '#FFFF00', '#FFE135', '#FFD700', '#FFFACD']; // 紙吹雪の色のセットを定義
        const diamondCount = 300;                                               // ダイヤモンド形紙吹雪の数を設定

        // 指定した数のダイヤモンド形紙吹雪を作成して配置する
        for (let i = 0; i < diamondCount; i++) { 
            const diamond = createDiamond(
                Math.random() * window.innerWidth,                // 横位置をランダムに設定
                -Math.random() * window.innerHeight * 2,          // 上から画面外の位置に配置
                colors[Math.floor(Math.random() * colors.length)] // 色をランダムに選択
            );
            Matter.Composite.add(engine.world, diamond);          // 作成したダイヤモンドを物理エンジンに追加
        }

        document.body.classList.add('confetti-active');           // 紙吹雪がアクティブな状態にするクラスをボディに追加
        Matter.Runner.run(engine);                                // Matter.js のエンジンとレンダリングを開始
        Matter.Render.run(render);                                // 紙吹雪を描画

        // 紙吹雪を20秒後に停止
        setTimeout(() => {
            Matter.Runner.stop(engine); 
        }, 20000);
    }

    // 新しいゲームを開始する関数
    function startNewGame() { 
        messageElement.style.display = 'none';                              // メッセージ要素を非表示にして、ゲーム画面をクリアにする

        if (clearedNumbers.length === 10) {                                 // クリアされたターゲットナンバーが10個に達しているかを確認
            messageElement.textContent = "Completed! Congratulations!";     // ゲームクリアのメッセージを設定
            messageElement.style.display = 'block';                         // メッセージ要素を表示して、ゲームクリアを知らせる
            showConfetti();                                                 // 紙吹雪を降らせて、クリアを祝うエフェクトを実行する
            return;
        }

        numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);                     // 1から9までの数字をシャッフルしてタイルに割り当てる
        selectedTiles = [];                                                 // 選択されたタイルをクリア
        tiles.forEach(tile => {                                             // 各タイルを初期化し、新しい数値を設定
            tile.classList.remove("flipped", "all-clear", "same-number");   // 既存のクラスを削除
            tile.textContent = "";                                          // テキストをクリア
            tile.dataset.number = numbers[Number(tile.dataset.index)];      // シャッフルされた数値を割り当て
        });
        targetNumber = getRandomTarget();                                   // 新しいターゲットナンバーを取得
        document.getElementById("targetNumber").textContent = targetNumber; // 新しいターゲットナンバーを表示
        updateTargetTiles();                                                // ターゲットタイルの状態を更新
    }

    // ゲームをリセットする関数
    function resetGame() { 
        document.getElementById("gameBoardContainer").style.display = "none"; // ゲームボードや情報エリアを非表示
        document.getElementById("info").style.display = "none";
        document.getElementById("targetNumbersContainer").style.display = "none";
        messageElement.style.display = 'none';                                // メッセージを非表示
        startMessage.style.display = "block";                                 // スタートメッセージを表示

        clearedNumbers = [];                                                  // クリア済みのターゲットナンバーのリストを初期化
        selectedTiles = [];                                                   // プレイヤーが選択したタイルのリストを初期化
        tiles.forEach(tile => {                                               // すべてのタイルをリセット
            tile.classList.remove("flipped", "all-clear", "same-number");     // タイルに付与されたクラスを削除して、見た目をリセット
            tile.textContent = "";                                            // タイルに表示されている数字をクリア
        });

        Matter.Engine.clear(engine);                            // Matter.js のエンジンをクリアして、紙吹雪の状態をリセット
        document.body.classList.remove('confetti-active');      // 紙吹雪エフェクトが終了したことを示すため、'confetti-active' クラスを削除
        document.body.classList.remove('all-clear-background'); // 背景を通常の背景に戻すため、'all-clear-background' クラスを削除
    }

    // タイルがクリックされたときの処理
    tiles.forEach((tile) => { 
        tile.addEventListener("click", () => {
            if (isProcessing) return;                     // 処理中であればクリックを無視

            messageElement.style.display = 'none';        // メッセージを非表示

            // タイルがまだ開かれておらず、かつ同じ番号でマッチしていない場合の処理
            if (!tile.classList.contains("flipped") && !tile.classList.contains("same-number")) {
                tile.classList.add("flipped");            // タイルを開くクラスを追加
                tile.textContent = tile.dataset.number;   // タイルに数字を表示
                selectedTiles.push(tile);                 // 選択されたタイルを配列に追加

                // 2枚のタイルが選択された場合の処理
                if (selectedTiles.length === 2) { 
                    isProcessing = true;                  // 他の操作を受け付けないように処理中フラグを立てる
                    const num1 = Number(selectedTiles[0].dataset.number); // 1枚目のタイルの数値を取得
                    const num2 = Number(selectedTiles[1].dataset.number); // 2枚目のタイルの数値を取得
                    const sum = num1 + num2;                              // 2枚のタイルの数値の合計を計算


                    // 2枚の合計がターゲットナンバーと一致し、かつ同じ番号でない場合
                    if (sum === targetNumber && num1 !== num2) { 
                        selectedTiles.forEach(tile => {
                            tile.classList.add("flipped"); // 両方のタイルをマッチング成功として表示
                        });
                        messageElement.textContent = "Found a match!"; // マッチング成功のメッセージを設定
                        messageElement.style.display = 'block';        // メッセージを表示
                        selectedTiles = [];                            // selectedTilesをクリアしてリセット
                        checkAllMatches();                             // マッチ可能なすべてのタイルがマッチしたかを確認
                    } else {
                        //0.5秒後にタイルを元に戻す
                        setTimeout(() => {
                            selectedTiles.forEach(tile => {
                                tile.classList.remove("flipped");      // タイルを元の状態に戻す
                                tile.textContent = "";                 // タイルの数値表示をクリア
                            });
                            selectedTiles = [];                        // selectedTilesをリセット
                            isProcessing = false;                      // 処理中フラグを解除
                        }, 500);
                    }
                // ターゲットナンバーと同じタイルを選択した場合の処理
                } else if (Number(tile.dataset.number) === targetNumber) { 
                    tile.classList.add("same-number");                 // タイルに同じナンバーのクラスを追加
                    messageElement.textContent = "Same!";              // メッセージを表示
                    messageElement.style.display = 'block';
                    selectedTiles = [];                                // selectedTilesをクリア
                    checkAllMatches();                                 // マッチ可能なすべてのタイルがマッチしたかを確認
                    isProcessing = false;                              // 処理中フラグを解除
                }
            }
        });
    });

    // 配列をシャッフルする関数
    function shuffle(array) { 
        // フィッシャー・イェーツのアルゴリズムで配列をランダムに並び替える
        for (let i = array.length - 1; i > 0; i--) { 
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // ランダムにターゲットナンバーを取得する関数
    function getRandomTarget() { 
        const possibleNumbers = Array.from({ length: 10 }, (_, i) => i + 1).filter(num => !clearedNumbers.includes(num)); // クリアされていないターゲットナンバーのリストを作成
        return possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)]; // その中からランダムに一つ選んで返す
    }

    // マッチング状態を確認する関数
    function checkAllMatches() { 
        const flippedTiles = document.querySelectorAll(".flipped, .same-number"); // 現在マッチしているタイルを取得
        const flippedNumbers = Array.from(flippedTiles).map(tile => Number(tile.dataset.number)); // 取得したタイルから、それぞれの数値を抽出して配列に変換
        
        let allMatched = true;                                          // すべてのタイルがマッチしているかを確認するフラグ
        tiles.forEach(tile => {                                         // すべてのタイルをループし、マッチしていないタイルが残っていないかを確認
            const num = Number(tile.dataset.number);                    // タイルの数値を取得
            if (!flippedNumbers.includes(num) && isUsableNumber(num)) { // タイルがまだマッチしておらず、かつマッチ可能な数値である場合
                allMatched = false;                                     // マッチしていないタイルがある場合、フラグを false に設定
            }
        });

        // マッチするタイルがすべて開かれた場合の処理
        if (allMatched) { 
            setTimeout(() => {
                tiles.forEach(tile => {
                    // まだ開かれていないタイルを「all-clear」に設定し、黄色で表示
                    if (!tile.classList.contains("flipped") && !tile.classList.contains("same-number")) {
                        tile.classList.add("all-clear");                    // タイルに「all-clear」クラスを追加し、開いた状態にする
                        tile.textContent = tile.dataset.number;             // タイルに数値を表示
                    }
                });
                messageElement.textContent = "All clear!";                  // メッセージのテキストを「All clear!」に
                messageElement.style.display = 'block';                     // メッセージ要素を表示
                document.body.classList.add('all-clear-background');        // 背景色を「All clear」状態に変更
                clearedNumbers.push(targetNumber);                          // クリアされたターゲットナンバーをクリア済みリストに追加
                updateTargetTiles();                                        // ターゲットタイルの状態を更新
                //1秒後に次のゲームを開始する
                setTimeout(() => {
                    startNewGame();                                         // 次のゲームを開始
                    document.body.classList.remove('all-clear-background'); // 背景色を元に戻す
                    isProcessing = false;                                   // 処理中フラグを解除
                }, 1000);
            }, 500);    // 0.5秒待機してから処理を実行
        } else {
            isProcessing = false; // まだすべてのマッチが完了していない場合、処理中フラグを解除
        }
    }

    // クリアされたターゲットタイルを更新する関数
    function updateTargetTiles() { 
        targetTiles.forEach(tile => {                           // 各ターゲットタイルをループし、その状態を更新
            const num = Number(tile.dataset.number);            // タイルの数値を取得
            tile.classList.remove("current-target", "cleared"); // 現在のターゲットやクリア状態を示すクラスを一旦削除
            
            if (num === targetNumber) {                         // タイルの数値が現在のターゲットナンバーと一致する場合
                tile.classList.add("current-target");           // 現在のターゲットナンバーとして強調表示するためのクラスを追加
            } else if (clearedNumbers.includes(num)) {          // タイルの数値がクリア済みのターゲットナンバーに含まれている場合
                tile.classList.add("cleared");                  // クリア済みであることを示すクラスを追加
            }
        });
    }

    // 指定された数値がターゲットナンバーと関連してゲーム内で有効かどうかを確認する関数
    function isUsableNumber(num) { 
        if (num === targetNumber) return true;                                // 数値がターゲットナンバーと一致する場合は有効とする
        if (targetNumber % 2 === 0 && num === targetNumber / 2) return false; // ターゲットナンバーが偶数で、その半分の数値は無効とする
        return num < targetNumber;                                            // 数値がターゲットナンバーより小さい場合は有効とする
    }

    // ウィンドウのリサイズ時にキャンバスサイズを再調整する処理
    window.addEventListener('resize', () => { 
        render.canvas.width = window.innerWidth;                      // キャンバスの幅をウィンドウの幅に合わせる
        render.canvas.height = window.innerHeight;                    // キャンバスの高さをウィンドウの高さに合わせる
        Matter.Render.setPixelRatio(render, window.devicePixelRatio); // デバイスのピクセル比に基づいて描画の解像度を調整
    });
});
