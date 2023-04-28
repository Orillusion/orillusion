export type ProfilerLabel2 = {
    lable:string ,
    start:number ,
    end:number ,
    total:number ,
    count:number ,
}


export type ProfilerLabel = {
    lable:string ,
    start:number ,
    end:number ,
    total:number ,
    count:number ,
    child:Map<string,ProfilerLabel2>
}

export class ProfilerUtil {
    private static profilerLabelMap:Map<string,ProfilerLabel> = new Map<string,ProfilerLabel>();

    public static start(id:string){
        let profilerLabel = this.profilerLabelMap.get(id);
        if(!profilerLabel){
            profilerLabel = {
                lable : id ,
                start : 0 ,
                end : 0,
                total: 0 ,
                count : 0 ,
                child :new Map<string,ProfilerLabel2>()
            }
            this.profilerLabelMap.set(id,profilerLabel);
        }
        profilerLabel.start = performance.now() ;
        profilerLabel.end = performance.now() ;
        profilerLabel.count = 0 ;
        profilerLabel.child.clear();
    }

    public static end( id:string ){
        let profilerLabel = this.profilerLabelMap.get(id);
        if(profilerLabel){
            profilerLabel.end = performance.now() ;
            profilerLabel.total = profilerLabel.end - profilerLabel.start ;
        }
    }

    public static countStart( id:string , id2:string = "" ){
        let profilerLabel = this.profilerLabelMap.get(id);
        if(profilerLabel){
            profilerLabel.count++ ;
            if(id2 != "" ){
                let node = profilerLabel.child.get(id2);
                if(!node){
                    node = {
                        lable : id2 ,
                        start : 0 ,
                        end : 0,
                        total: 0 ,
                        count : 0 ,
                    }
                }
                node.start = performance.now() ;
                node.end = performance.now() ;
                node.count = 0 ;
                profilerLabel.child.set(id2,node);
            }
        }
    }

    public static countEnd( id:string , id2:string ){
        let profilerLabel = this.profilerLabelMap.get(id);
        if(profilerLabel){
            if(id2 != "" ){
                let node = profilerLabel.child.get(id2);
                if(!node){
                    node = {
                        lable : id2 ,
                        start : 0 ,
                        end : 0,
                        total: 0 ,
                        count : 0 ,
                    }
                }
                node.end = performance.now() ;
                node.total = node.end - node.start ;
                node.count++ ;
            }
        }
    }

    public static print(id:string){
        let profilerLabel = this.profilerLabelMap.get(id);
        if(profilerLabel){
           console.log( "performance" , id , profilerLabel.total + " ms" );
        }
    }
}
