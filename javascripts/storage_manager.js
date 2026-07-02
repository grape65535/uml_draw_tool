/*------------------------------------------------------------------------------
  不揮発データ記録管理
    localstorageに仮想的なディレクトリ・ファイル管理を実現します
------------------------------------------------------------------------------*/
function StorageManager(){

  //--------------------------------------
  // ディレクトリ階層の取得・生成
  //--------------------------------------
  StorageManager.prototype._getDirectory = function( path, force_create_flag ){
    force_create_flag = force_create_flag || false;

    var paths = path.split("/");
    var directory = this.data.directories;
    for ( var i=0; i<paths.length; i++ ) {
      if ( i == paths.length -1 && "" == paths[i] ) break;
      if ( null == directory[ paths[i] ] || "undefined" == typeof directory[ paths[i] ] ) {
        if ( force_create_flag ) {
          directory[ paths[i] ] = {};
        }
        else {
          return null;
        }
      }
      directory = directory[ paths[i] ]
    }
    return directory;
  }

  //--------------------------------------
  // パスの作成
  //--------------------------------------
  StorageManager.prototype._getPath = function( path ){
    var current_directories = this.current_directory.split("/");
    var paths = path.split("/");
    for ( var i=0; i<paths.length; i++ ) {
      switch( paths[i] ) {
      case "":
        if ( i == 0 ) {
          current_directories = [ "" ];
        }
        break;

      case ".":
        break;

      case "..":
        if ( 0 < current_directories.length ) current_directories.splice( current_directories.length - 1, 1 );
        if ( 0 == current_directories.length ) current_directories = [ "" ];
        break;

      default:
        current_directories.push( paths[i] );
        break;
      }
    }
    return current_directories.join("/");
  };

  //--------------------------------------
  // ファイルパス？
  //--------------------------------------
  StorageManager.prototype._isFilePath = function( path ){
    if ( this._isDirectoryPath( path ) ) return false;

    // フルパスの最後はファイル名とみなして、パスとファイル名を分離する
    var full_path = this._getPath( path );
    var file_name = this._getFileNameByPath( full_path );
    full_path = this._getDirectoryPathByPath( full_path );

    // ディレクトリは存在する？
    if ( this._isDirectoryPath( full_path ) ) {
      // ファイルは存在する？
      return ( this.data.files[ full_path ] && this.data.files[ full_path ][ file_name ] ) ? true : false
    }
    return false;
  }

  //--------------------------------------
  // ディレクトリパス？
  //--------------------------------------
  StorageManager.prototype._isDirectoryPath = function( path ){
    if ( "/" == path.charAt( path.length - 1 ) ) return true;
    var full_path = this._getPath( path );
    var directory = this._getDirectory( full_path );

    return null == directory ? false : true;
  }

  //--------------------------------------
  // パスからファイル名を取得する
  //--------------------------------------
  StorageManager.prototype._getFileNameByPath = function( path ){
    if ( this._isDirectoryPath( path ) ) return null;
    var paths = path.split("/");
    var file_name = paths[ paths.length - 1 ];
    return 0 < file_name.length ? file_name : null;
  }

  //--------------------------------------
  // パスから末端のディレクトリ名を取得する
  //--------------------------------------
  StorageManager.prototype._getSproutDirectoryNameByPath = function( path ){
    var directory_path = this._getDirectoryPathByPath( path );
    var paths = directory_path.split("/");

    if ( 0 == paths.length ) return "";
    var directory_name = paths[ paths.length - 1 ];

    return 0 < directory_name.length ? directory_name : null;
  }

  //--------------------------------------
  // パスからディレクトリパス部を取得する
  //--------------------------------------
  StorageManager.prototype._getDirectoryPathByPath = function( path ){
    if ( this._isDirectoryPath( path ) ) {
      return path;
    }
    var paths = path.split("/");
    paths.splice( paths.length - 1, 1 );
    return paths.join("/");
  }

  //--------------------------------------
  // パスから親ディレクトリパス部を取得する
  //--------------------------------------
  StorageManager.prototype._getParentDirectoryPathByPath = function( path ){
    var directory_path = this._getDirectoryPathByPath( path );
    var paths = directory_path.split("/");
    paths.splice( paths.length - 1, 1 );
    return paths.join("/");
  }

  //--------------------------------------
  // ファイルの移動
  //--------------------------------------
  StorageManager.prototype._moveFile = function( source_path, dest_path ){
    if ( ! this.isExistFile( source_path ) ) return false;

    // 移動元のディレクトリ情報を取得
    var source_file_name = this._getFileNameByPath( source_path );
    var source_full_path = this._getPath( this._getDirectoryPathByPath( source_path ) );

    // 移動先のディレクトリ情報を取得
    var dest_file_name = this._getFileNameByPath( dest_path );
    var dest_full_path = this._getPath( this._getDirectoryPathByPath( dest_path ) );
    if ( null == dest_file_name ) dest_file_name = source_file_name;

    // 移動先のディレクトリの準備
    if ( ! this.makeDirectory( dest_full_path ) ) return false;

    var file = this.data.files[ source_full_path ][ source_file_name ];
    var index = 0;
    var suffix = "";

    // 削除できなかったら失敗
    if ( ! this.removeFile( source_path ) ) return false;

    // 移動先へのファイル保存を、成功するまでファイル名を変えて繰り返す
    while( ! this.createFile( dest_full_path, dest_file_name + suffix, file.type, file.contents ) ) {
      index++;
      suffix = `(${index.toString()})`;
    }

    return true;
  };

  //--------------------------------------
  // ディレクトリの移動
  //--------------------------------------
  StorageManager.prototype._moveDirectory = function( source_path, dest_path ){
    if ( ! this.isExistDirectory( source_path ) ) return false;

    // 移動元のディレクトリ情報を取得
    var source_directory_name = this._getSproutDirectoryNameByPath( source_path );
    var source_full_path = this._getPath( this._getDirectoryPathByPath( source_path ) );

    // 移動先のディレクトリ情報を取得
    var dest_directory_name = this._getSproutDirectoryNameByPath( dest_path );
    var dest_full_path = this._getPath( this._getDirectoryPathByPath( dest_path ) );
    if ( null == dest_directory_name && null != source_directory_name ) {
      dest_full_path = dest_full_path + "/" + source_directory_name;
      dest_directory_name = source_directory_name;
    }

    // 移動先のディレクトリの準備
    if ( ! this.makeDirectory( dest_full_path ) ) return false;

    // 下位のディレクトリがあるなら先に再帰で移動させる
    var directory = this._getDirectory( source_path );
    for ( var child in directory ) {
      this.move( source_full_path + "/" + child + "/", dest_full_path + "/" + child + "/" );
    }

    // この時点で移動先のディレクトリが未作成ならば作成されているので、ファイル移動だけ行う
    for ( var file_name in this.data.files[ source_full_path ] ) {
      this.move( source_full_path + "/" + file_name, dest_full_path + "/" + file_name );
    }

    // 移動元を削除
    if ( ! this.removeDirectory( source_full_path ) ) return false;

    return true;
  };

  //--------------------------------------
  // コンストラクタ
  //--------------------------------------
  StorageManager.prototype.initialize = function( application_name ){
    this.application_name = application_name || "_grape_framework_applications";
    this.data = JSON.parse( localStorage.getItem( this.application_name ) ) || {};
    this.current_directory = "";

    // ディレクトリ情報が無ければ初期化する
    if ( ! this.data.directories ) {
      this.data.directories = {};
    }
    // ファイル情報が無ければ初期化する
    if ( ! this.data.files ) {
      this.data.files = {};
    }

    // 最終更新日時を取得
    this.data.last_updated_at = this.data.last_updated_at || ( new Date ).getTime();
    this.loaded_at = this.data.last_updated_at;

    /* ディレクトリ・ファイル構造
      {
        directories: {
          directory_name1: {
            directory_name1-1: {
              ...
            },
          },
          directory_name2: {},
        },
        files: {
          file_path1: {
            file_name1: {
              type: ...,
              contents: JSON,
            },
            file_name2: {},
          },
          file_path2: {},
        }
      }
    */

    return this;
  };

  //--------------------------------------
  // カレントのディレクトリ名一覧の取得
  //--------------------------------------
  StorageManager.prototype.currentDirectoryNames = function(){
    var directory = this._getDirectory( this.current_directory );
    if ( null == directory ) return null;
    return Object.keys( directory );
  };

  //--------------------------------------
  // カレントのファイル名一覧の取得
  //--------------------------------------
  StorageManager.prototype.currentFileNames = function(){
    return Object.keys( this.data.files[this.current_directory] || {} );
  };

  //--------------------------------------
  // カレントのファイル一覧を取得
  //--------------------------------------
  StorageManager.prototype.currentFiles = function(){
    return this.data.files[this.current_directory] || {};
  };

  //--------------------------------------
  // 指定ディレクトリ下のディレクトリ名一覧の取得
  //--------------------------------------
  StorageManager.prototype.directoryNamesByPath = function( path ){
    var directory = this._getDirectory( this._getPath( path ) );
    if ( null == directory ) return null;
    return Object.keys( directory );
  };

  //--------------------------------------
  // 指定ディレクトリ下のファイル名一覧の取得
  //--------------------------------------
  StorageManager.prototype.fileNamesByPath = function( path ){
    return Object.keys( this.data.files[ this._getPath( path ) ] || {} );
  };

  //--------------------------------------
  // 指定ディレクトリ下のファイル一覧を取得
  //--------------------------------------
  StorageManager.prototype.filesByPath = function( path ){
    return this.data.files[ this._getPath( path ) ] || {};
  };

  //--------------------------------------
  // 指定パスのファイルを取得
  //--------------------------------------
  StorageManager.prototype.fileByPath = function( path ){
    if ( ! this.isExistFile( path ) ) return null;

    var file_name = this._getFileNameByPath( path );
    var file_path = this._getDirectoryPathByPath( path )
    return this.data.files[ this._getPath( file_path ) ][ file_name ];
  };

  //--------------------------------------
  // パスは存在する？
  //--------------------------------------
  StorageManager.prototype.isExist = function( path ){
    path = this._getPath( path );
    return ( this.isExistFile( path ) || this.isExistDirectory( path + "/" ) ) ? true : false;
  };

  //--------------------------------------
  // ファイルは存在する？
  //--------------------------------------
  StorageManager.prototype.isExistFile = function( path ){
    path = this._getPath( path );
    var file_name = this._getFileNameByPath( path );
    var file_path = this._getDirectoryPathByPath( path )
    return this._isFilePath( path ) && this.data.files[ file_path ] && this.data.files[ file_path ][ file_name ] ? true : false;
  };

  //--------------------------------------
  // ディレクトリは存在する？
  //--------------------------------------
  StorageManager.prototype.isExistDirectory = function( path ){
    path = this._getPath( this._getDirectoryPathByPath( path ) );
    return this._getDirectory( path ) ? true : false;
  };

  //--------------------------------------
  // ディレクトリの移動
  //--------------------------------------
  StorageManager.prototype.changeDirectory = function( path ){
    if ( this._isDirectoryPath( path ) ) {
      // カレントを移動
      this.current_directory = this._getPath( path );
      return true;
    }

    return false;
  };

  //--------------------------------------
  // ディレクトリの作成
  //--------------------------------------
  StorageManager.prototype.makeDirectory = function( path ){
    var full_path = this._getPath( path );

    // 同名のファイルが存在する
    if ( this.isExistFile( path ) ) return false;
    
    var directory = this._getDirectory( full_path, true );
    if ( null == directory ) return false;

    return true;
  };

  //--------------------------------------
  // ファイルの保存
  //--------------------------------------
  StorageManager.prototype.createFile = function( path, file_name, type, json, force_create ){
    force_create = force_create || false;
    path = this._getPath( path );

    // 保存先のディレクトリが存在しないのならエラーとする（ただし強制作成時はディレクトリも作成）
    if ( ! this.isExistDirectory( path ) ) {
      if ( ! force_create ) {
        return false;
      }
      else {
        this.makeDirectory( path );
      }
    }

    this.data.files[ path ] = this.data.files[ path ] || {};

    // 保存するファイル名がまだ存在しないこと
    if ( force_create || ! this.isExist( path + "/" + file_name ) ) {
      this.data.files[ path ][ file_name ] = {
        type: type,
        contents: json,
      };
      return true;
    }

    return false;
  };

  //--------------------------------------
  // ファイルの上書き保存
  //--------------------------------------
  StorageManager.prototype.saveFile = function( path, file_name, type, json ){
    force_create = force_create || false;
    path = this._getPath( path );

    // 保存先のディレクトリが存在すること
    if ( this.data.files[ path ] ) {
      // 保存するファイル名が存在すること
      if ( this.data.files[ path ][ file_name ] ) {
        this.data.files[ path ][ file_name ] = {
          type: type,
          contents: json,
        };
        return true;
      }
    }
    
    return false;
  };

  //--------------------------------------
  // ファイルの削除
  //--------------------------------------
  StorageManager.prototype.removeFile = function( path ){
    if ( ! this._isFilePath( path ) || ! this.isExist( path ) ) return false;

    var file_name = this._getFileNameByPath( path );
    var full_path = this._getPath( this._getDirectoryPathByPath( path ) );

    delete this.data.files[ full_path ][ file_name ];

    return true;
  };

  //--------------------------------------
  // ディレクトリの削除
  //--------------------------------------
  StorageManager.prototype.removeDirectory = function( path ){
    if ( ! this._isDirectoryPath( path ) || ! this.isExist( path ) ) return false;

    path = this._getPath( path );

    // 削除対象のディレクトリ名と、その親ディレクトリへのパスを取得
    var directory_name = this._getSproutDirectoryNameByPath( path );
    var parent_path = this._getParentDirectoryPathByPath( path );

    // ディレクトリの削除
    if ( null != directory_name ) {
      var directory = this._getDirectory( parent_path );
      delete directory[ directory_name ];  
    }

    // ファイルを削除
    var delete_file_path_regexp = new RegExp( "^" + path.replace(/[\.\+\*\[\]\(\)\-\?\/\\]/ig, "\\$1") + "($|/.+$)", "i");
    for ( var file_path in this.data.files ) {
      if ( file_path.match( delete_file_path_regexp ) ) {
        delete this.data.files[ file_path ];
      }
    }

    return true;
  };

  //--------------------------------------
  // ファイル・ディレクトリの移動
  //--------------------------------------
  StorageManager.prototype.move = function( source_path, dest_path ){
    if ( ! this.isExist( source_path ) ) return false;
    if ( this._getPath( source_path ) == this._getPath( dest_path ) ) return true;

    // 失敗した時のロールバック用
    var backup_data = deepCopy( this.data );

    if (
       ( this._isFilePath( source_path ) && this._moveFile( source_path, dest_path ) )
    || ( this._isDirectoryPath( source_path ) && this._moveDirectory( source_path, dest_path ) )
    ) {
      return true;
    }
    // 移動できなかった時
    else {
      // ロールバック
      this.data = backup_data;
      return false;
    }
  };

  //--------------------------------------
  // ファイル・ディレクトリの不揮発領域への書き込み
  //--------------------------------------
  StorageManager.prototype.save = function(){
    var tmp_data = JSON.parse( localStorage.getItem( this.application_name ) ) || {};

    if ( ! tmp_data || ! tmp_data.last_updated_at || this.loaded_at == tmp_data.last_updated_at ) {
      this.data.last_updated_at = ( new Date ).getTime();
      this.loaded_at = this.data.last_updated_at;
      localStorage.setItem( this.application_name, JSON.stringify( this.data ) );
      return true;
    }

    return false;
  };

}
StorageManager();
