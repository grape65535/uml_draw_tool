/*------------------------------------------------------------------------------
  四分木
------------------------------------------------------------------------------*/
var LinearQuadTreeSpace = (function( width, height, level ){
  //--------------------------------------
  // コンストラクタ
  //   width  : 空間全体の幅
  //   height : 空間全体の高（奥行）
  //   level  : 分割する回数
  //--------------------------------------
  var LinearQuadTreeSpace = function( width, height, level ){
    this.width = width;
    this.height = height;
    this.data = [null];
    this.currentLevel = 0;
    
    // 入力レベルまでdataを伸長する。
    while(this.currentLevel < level) {
      this._expand();
    }
  };

  //--------------------------------------
  // dataをクリアする
  //--------------------------------------
  LinearQuadTreeSpace.prototype.clear = function() {
    this.data.fill(null);
  };

  //--------------------------------------
  // 指定ノードを線形四分木に追加する
  //--------------------------------------
  LinearQuadTreeSpace.prototype.append = function( node, x, y, width, height ) {
    var morton_info = this._getMortonInfoByRect( x, y, width, height );
    this._appendNode( node, morton_info.level, morton_info.index );
  };

  //--------------------------------------
  // 指定位置と同じ空間の全てのノードを取得する
  //--------------------------------------
  LinearQuadTreeSpace.prototype.getSameSpaceNodes = function( x, y, width, height ) {
    var same_space_node = [];
    var morton_info = this._getMortonInfoByRect( x, y, width, height );

    // 自階層を取得
    same_space_node = same_space_node.concat(
      this.data[
        this._getLinerInex( morton_info.level, morton_info.index )
      ]
    );

    // 範囲外など0階層だけの時
    if ( 0 == morton_info.level && 0 == morton_info.index ) return same_space_node;

    // 2つのモートン番号のうち、-1ではない方のモートン番号を利用
    var larger = Math.max( morton_info.left_top_morton, morton_info.right_bottom_morton );

    // 自空間が所属する上位階層を取得
    for ( var level=0; level<morton_info.level; level++ ) {
      same_space_node = same_space_node.concat(
        this.data[
          this._getLinerInex( level, this._getIndexInLevel( level, larger ) )
        ]
      );
    }

    // 自空間下の全ての下位階層を取得
    for ( var level=morton_info.level+1; level<=this.currentLevel; level++ ) {
      for ( var i=0; i<4; i++ ) {
        same_space_node = same_space_node.concat(
          this.data[
            this._getLinerInex( level, i )
          ]
        );
      }
    }

    return same_space_node;
  };

  //--------------------------------------
  // 同じ空間内にあるノード同士の総当たり比較を行う
  //--------------------------------------
  LinearQuadTreeSpace.prototype.bruteForce = function( compare_func ) {
    this._recursionBruteForce( compare_func );
  };

  //--------------------------------------
  // 再帰で総当たりを行う
  //--------------------------------------
  LinearQuadTreeSpace.prototype._recursionBruteForce = function( compare_func, index, parent_space_nodes ) {
    index = index || 0;
    parent_space_nodes = parent_space_nodes || [];

    var current_nodes = this.data[ index ];
    
    // 現在のセルの中と、衝突オブジェクトリストとで
    // 当たり判定を取る。
    this._bruteForceInCell( compare_func, current_nodes, parent_space_nodes );

    // 衝突オブジェクトリストにpushして、
    parent_space_nodes = parent_space_nodes.concat( current_nodes );

    // 次に下位セルを持つか調べる。
    // 下位セルは最大4個なので、i=0から3の決め打ちで良い。
    for( var i=0; i<4; i++ ) {
      var next_index = index * 4 + 1 + i;
      
      // 下位セルがあったら、
      var has_child_node = ( next_index < this.data.length) && ( this.data[ next_index ] !== null );
      if( has_child_node ) {
        // 下位セルで当たり判定を取る。再帰。
        this._recursionBruteForce( compare_func, next_index, parent_space_nodes );
      }
    }    
  };

  //--------------------------------------
  // 指定セル下のノードでの総当たり比較を行う
  //--------------------------------------
  LinearQuadTreeSpace.prototype._bruteForceInCell = function( compare_func, nodes, parent_space_nodes ) {
    // 指定ノードの総当たり
    for( var i=0; i<nodes.length-1; i++ ) {
      var node1 = nodes[i];
      for( var j=i+1; j<nodes.length; j++ ) {
        var node2 = nodes[j];
        compare_func( node1, node2 );
      }
    }

    // 親ノードとの総当たり
    for( var i=0; i<parent_space_nodes.length; i++ ) {
      var node1 = parent_space_nodes[i];
      for( var j=0; j<nodes.length; j++ ) {
        var node2 = nodes[j];
        compare_func( node1, node2 );
      }
    }
  };

  //--------------------------------------
  // 線形四分木のインデックス番号を取得する
  //--------------------------------------
  LinearQuadTreeSpace.prototype._getLinerInex = function( level, index ) {
    // 上位階層分の配列要素数のオフセットを計算
    var offset = ((4 ** level) - 1) / 3;
    return offset + index;
  }

  //--------------------------------------
  // 要素を追加する
  //--------------------------------------
  LinearQuadTreeSpace.prototype._appendNode = function( node, level, index ) {
    var linearIndex = this._getLinerInex( level, index )

    // もしdataの長さが足りないなら拡張する。
    while(this.data.length <= linearIndex) {
      this._expandData();
    }

    // セルの初期値はnullとする。
    // しかし上の階層がnullのままだと面倒が発生する。
    // なので要素を追加する前に親やその先祖すべてを
    // 空配列で初期化する。
    let parentCellIndex = linearIndex;
    while(this.data[parentCellIndex] === null) {
      this.data[parentCellIndex] = [];

      parentCellIndex = Math.floor((parentCellIndex - 1) / 4);
      if(parentCellIndex >= this.data.length) {
        break;
      }
    }

    // セルに要素を追加する。
    var cell = this.data[linearIndex];
    cell.push(node);
  };

  //--------------------------------------
  // 線形四分木の長さを伸ばす。
  //--------------------------------------
  LinearQuadTreeSpace.prototype._expand = function() {
    var nextLevel = this.currentLevel + 1;
    var length = ((4 ** (nextLevel+1)) - 1) / 3;

    while(this.data.length < length) {
      this.data.push(null);
    }

    this.currentLevel++;
  };

  //--------------------------------------
  // 座標からモートン番号を算出する
  //--------------------------------------
  LinearQuadTreeSpace.prototype._getMortonByPosition = function(x, y) {
    // 空間の外の場合-1を返す
    if(x < 0 || y < 0) return -1;
    if(x > this.width || y > this.height) return -1;

    // 空間の中の位置を求める。
    var xCell = Math.floor(x / (this.width / (2 ** this.currentLevel)));
    var yCell = Math.floor(y / (this.height / (2 ** this.currentLevel)));

    // x位置とy位置をそれぞれ1bit飛ばしの数にし、
    // それらをあわせてひとつの数にする。
    // これがモートン番号となる。
    return (this._separateBit32(xCell) | (this._separateBit32(yCell)<<1));
  };

  //--------------------------------------
  // 矩形座標からモートン番号情報を算出する
  // return {
  //   left_top_morton: 0, // モートン番号
  //   right_bottom_morton: 0, // モートン番号
  //   level: 0, // 四分木階層レベル
  //   index: 0, // 当該階層レベル内でのインデックス番号
  // }
  //--------------------------------------
  LinearQuadTreeSpace.prototype._getMortonInfoByRect = function( x, y, width, height ) {
    // モートン番号を取得
    var left_top_morton = this._getMortonByPosition( x, y );
    var right_bottom_morton = this._getMortonByPosition( x + width, y + height );

    // -1は四分木の範囲外の時。モートン番号0とする（範囲外を登録させない場合は-1など別の値を返してエラー処理すること）
    if( left_top_morton === -1 && right_bottom_morton === -1) {
      return {
        left_top_morton: left_top_morton,
        right_bottom_morton: right_bottom_morton,
        level: 0,
        index: 0,
      };
    }
    
    // 2つのモートン番号が収まるモートン番号を取得する
    // 同じ番号なら、1つのセルに収まっている
    if ( left_top_morton == right_bottom_morton ) {
      return {
        left_top_morton: left_top_morton,
        right_bottom_morton: right_bottom_morton,
        level: this.currentLevel,
        index: left_top_morton,
      };
    }

    // 2つのモートン番号のセルが所属できるレベルを取得する
    var level = this._getMortonLevel( left_top_morton, right_bottom_morton );
    
    // 指定レベルでの指定モートン番号を含む上位モートン番号を取得する。
    // （2つのうち、-1ではない方のモートン番号を利用）
    var larger = Math.max( left_top_morton, right_bottom_morton );
    return {
      left_top_morton: left_top_morton,
      right_bottom_morton: right_bottom_morton,
      level: level,
      index: this._getIndexInLevel( level, larger ),
    };
  };

  //--------------------------------------
  // 指定モートンの指定階層でのインデックス番号を取得
  //--------------------------------------
  LinearQuadTreeSpace.prototype._getIndexInLevel = function( level, morton ) {
    // 階層を求めるときにシフトした数だけ右シフトすれば空間の位置がわかる。
    var shift = ((this.currentLevel - level) * 2);
    return morton >> shift;
  };

  //--------------------------------------
  // モートン空間を含むレベルを取得する
  //--------------------------------------
  LinearQuadTreeSpace.prototype._getMortonLevel = function( morton1, morton2 ) {
    // XORを取った数を2bitずつ右シフトして、
    // 0でない数が捨てられたときのシフト回数を採用する。
    var xorMorton = morton1 ^ morton2;
    let level = this.currentLevel - 1;
    let attachedLevel = this.currentLevel;

    for(let i = 0; level >= 0; i++) {
      var flag = (xorMorton >> (i * 2)) & 0x3;
      if(flag > 0) {
        attachedLevel = level;
      }

      level--;
    }

    return attachedLevel;
  };

  //--------------------------------------
  // 16bitの数値を1bit飛ばしの32bitにする。
  //--------------------------------------
  LinearQuadTreeSpace.prototype._separateBit32 = function(n) {
    n = (n|(n<<8)) & 0x00ff00ff;
    n = (n|(n<<4)) & 0x0f0f0f0f;
    n = (n|(n<<2)) & 0x33333333;
    return (n|(n<<1)) & 0x55555555;
  };

  return LinearQuadTreeSpace;
})();
