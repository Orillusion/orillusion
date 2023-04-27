export interface ITexture {
    /**
     * create binding layout description
     */
    internalCreateBindingLayoutDesc();

    /**
     * create texture instance
     */
    internalCreateTexture();

    /**
     * create GPU View
     */
    internalCreateView();

    /**
     * create CPU Sample
     */
    internalCreateSampler();
}