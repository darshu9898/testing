import  { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req,res) {
    try {

        //for now using userId from query, will replace with nextAuth session credentials later.
        const userId = req.query.userId;
        if(!userId) return res.status(400).json({ error: 'User Id required '});

        //fetching user's cart

        if(req.method === 'GET') {
            const cartItems = await.prisma.cart.findMany({
                where: { userId: parseInt( userId ) },
                include: { product : true }, //includes product details name,description,image,etc
            });
            return res.status(200).json(cartItems);
        }

        //post method: localStorage cart or login or add new item (should we implement debounce for this?)

        if(req.method === 'POST') {

            const { cartItems } = req.body; //expects [{ productId, quantity,...}]

            if(!cartItems || !Array.isArray(cartItems)) {
                return res.status(400).json({ error: 'cartItems array required' });
            }

            const results = [];

            for(const item of cartItems) {
                const { productId, productQty } = item;

                //check if product is already in user's cart
                const existing = await prisma.cart.findFirst({
                    where: { userId: parseInt(userId) , productId: parseInt(productId) }
                });

                if(existing) {
                    //update quantity
                    const updated = await prisma.cart.update({
                        where: { cartId : existing.cartId },
                        data: { productQty: existing.productQty + parseInt(productQty)}
                    });
                    results.push(updated);
                }
                else {
                    //add new item to cart
                    const newItem = await prisma.cart.create({
                        where: { userId: parseInt(userId) },
                        data: {
                            userId: parseInt(userId),
                            productId: parseInt(productId),
                            productQty: parseInt(productQty),
                        }
                    });
                    results.push(newItem);
                }
            }
            return res.status(200).json(results);
        }
        return res.status(405).json({ error: 'Method not allowed' });
    } catch(error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal server error'});
    }
}