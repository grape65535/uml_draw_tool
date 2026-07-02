//--------------------------------------
// 第一引数の配列に、第二引数の要素（または配列の全要素）が含まれているか？
//--------------------------------------
function isIncludeArray( target_array, cmp ){
  if ( cmp instanceof Array ) {
    for ( var i=0; i<cmp.length; i++ ) {
      if ( ! isIncludeArray( target_array, cmp[i] ) ) return false;
    }
    return true;
  }

  for ( var i=0; i<target_array.length; i++ ) {
    if ( target_array[i] == cmp ) return true;
  }
  return false;
}

//--------------------------------------
// 第一引数の配列に、第二引数の要素（または配列の全要素）が含まれている時に当該要素を削除する
//--------------------------------------
function removeArray( target_array, cmp ){
  if ( cmp instanceof Array ) {
    for ( var i=0; i<cmp.length; i++ ) {
      removeArray( target_array, cmp[i] );
    }
    return target_array;
  }

  for ( var i=0; i<target_array.length; i++ ) {
    if ( target_array[i] == cmp ) target_array.splice( i--, 1 );
  }
  return target_array;
}

//--------------------------------------
// オブジェクトのコピー
//--------------------------------------
function deepCopy( target ){
  if ( target instanceof Array ) {
    var copy_array = [];
    for ( var i=0; i<target.length; i++ ) {
      copy_array[i] = deepCopy( target[i] );
    }
    return copy_array;
  }
  else if ( null == target ) {
    return null;
  }
  else if ( "object" == typeof target ) {
    var copy_object = {};
    for ( var key in target ) {
      copy_object[key] = deepCopy( target[key] );
    }
    return copy_object;
  }
  return target;
}
