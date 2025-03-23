exports.sendMessage = (req, res) => {
    const { name, email, subject, message, type } = req.body;
  
    // Aquí podrías guardar el mensaje o enviarlo por email
  
    res.json({
      success: true,
      message: `¡Gracias por tu mensaje, ${name}!`
    });
  };