/**
 * instance reference statistics module
 * apply any instance , used full destroy
 */
export class Reference {
    protected reference: Map<any, Map<any, any>>;

    private static _ins: Reference;

    public static getInstance(): Reference {
        this._ins ||= new Reference();
        return this._ins;
    }

    /**
     * current instance attached from parent instance
     * @param ref reference current 
     * @param target reference parent
     */
    public attached(ref: any, target: any) {
        this.reference ||= new Map<any, Map<any, any>>();

        let refMap = this.reference.get(ref);
        refMap ||= new Map<any, any>();
        refMap.set(target, ref);

        this.reference.set(ref, refMap);
    }

    /**
     * current instance detached from parent instance
     * @param ref reference current 
     * @param target reference parent
     */
    public detached(ref: any, target: any) {
        let refMap = this.reference.get(ref);
        if (refMap) {
            refMap.delete(target);
        }
    }

    /**
     * current instance has reference 
     */
    public hasReference(ref: any): boolean {
        let refMap = this.reference.get(ref);
        if (refMap) {
            return refMap.size > 0;
        }
        return false;
    }

    /**
     * get current instance reference count
     * @param ref 
     * @returns 
     */
    public getReferenceCount(ref: any): number {
        let refMap = this.reference.get(ref);
        if (refMap) {
            return refMap.size;
        }
        return 0;
    }

    /**
    * get current instance reference from where
    * @param ref 
    * @returns 
    */
    public getReference(ref: any): Map<any, any> {
        let refMap = this.reference.get(ref);
        if (refMap) {
            return refMap;
        }
        return null;
    }

}