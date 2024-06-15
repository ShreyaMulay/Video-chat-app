const loadIndex = async(req,res)=>{
    try{

        res.render('index')

    }
    catch(error){
        console.error(error)

    }
}

module.exports = {
    loadIndex
}